import JSZip from 'jszip';
import type { ParsedTweet, TwitterExportTweet } from './types';

// Twitter export date format: "Mon Jan 01 12:00:00 +0000 2024"
function parseTwitterDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid Twitter date: ${dateStr}`);
  }
  return date.toISOString();
}

// Strip HTML source tag to plain text: '<a href="...">Twitter Web App</a>' -> 'Twitter Web App'
function parseSource(source: string | undefined): string | null {
  if (!source) return null;
  const match = />([^<]+)</.exec(source);
  return match ? match[1] : source;
}

function classifyTweetType(
  tweet: TwitterExportTweet['tweet']
): ParsedTweet['tweet_type'] {
  // Retweets start with "RT @"
  if (tweet.full_text.startsWith('RT @')) {
    return 'retweet';
  }

  // Replies have in_reply_to_status_id_str set
  if (tweet.in_reply_to_status_id_str) {
    return 'reply';
  }

  // Quote tweets reference another tweet via a twitter.com/*/status/* URL
  const urls = tweet.entities.urls ?? [];
  const hasQuoteUrl = urls.some(
    (u) =>
      u.expanded_url && /twitter\.com\/\w+\/status\/\d+/.test(u.expanded_url)
  );
  if (hasQuoteUrl) {
    return 'quote_tweet';
  }

  return 'post';
}

function extractQuotedTweetId(
  tweet: TwitterExportTweet['tweet']
): string | null {
  const urls = tweet.entities.urls ?? [];
  for (const url of urls) {
    if (!url.expanded_url) continue;
    const match = /twitter\.com\/\w+\/status\/(\d+)/.exec(url.expanded_url);
    if (match) return match[1];
  }
  return null;
}

function extractRetweetedTweetId(
  tweet: TwitterExportTweet['tweet']
): string | null {
  // Retweet entities sometimes include the original tweet's media
  // with a source_status_id_str, but the export format doesn't
  // consistently provide the retweeted tweet ID. Extract from
  // the entities media if available.
  const media = tweet.entities.media ?? [];
  for (const m of media) {
    const mediaRecord = m as unknown as Record<string, unknown>;
    if (mediaRecord['source_status_id_str']) {
      return mediaRecord['source_status_id_str'] as string;
    }
  }
  return null;
}

export function parseTweet(entry: TwitterExportTweet): ParsedTweet {
  const { tweet } = entry;
  const tweetType = classifyTweetType(tweet);

  return {
    id: tweet.id_str,
    tweet_type: tweetType,
    full_text: tweet.full_text,
    created_at: parseTwitterDate(tweet.created_at),
    retweet_count: parseInt(tweet.retweet_count, 10) || 0,
    favorite_count: parseInt(tweet.favorite_count, 10) || 0,
    reply_count: parseInt(tweet.reply_count ?? '0', 10) || 0,
    quote_count: parseInt(tweet.quote_count ?? '0', 10) || 0,
    in_reply_to_tweet_id: tweet.in_reply_to_status_id_str ?? null,
    in_reply_to_user_id: tweet.in_reply_to_user_id_str ?? null,
    in_reply_to_screen_name: tweet.in_reply_to_screen_name ?? null,
    quoted_tweet_id:
      tweetType === 'quote_tweet' ? extractQuotedTweetId(tweet) : null,
    retweeted_tweet_id:
      tweetType === 'retweet' ? extractRetweetedTweetId(tweet) : null,
    conversation_id: tweet.conversation_id_str ?? null,
    source: parseSource(tweet.source),
    lang: tweet.lang ?? null,
    raw_json: JSON.parse(JSON.stringify(tweet)) as ParsedTweet['raw_json'],
    entities: tweet.entities,
    extended_entities: tweet.extended_entities,
  };
}

/**
 * Parse tweets.js content from a Twitter data export.
 * The file starts with `window.YTD.tweet.part0 = ` followed by JSON.
 */
export function parseTweetsJs(content: string): ParsedTweet[] {
  // Strip the JS variable assignment prefix
  const jsonStr = content.replace(/^window\.YTD\.tweet\.part\d+\s*=\s*/, '');

  let entries: TwitterExportTweet[];
  try {
    entries = JSON.parse(jsonStr) as TwitterExportTweet[];
  } catch {
    throw new Error(
      'Failed to parse tweets.js. Expected JSON array after stripping prefix.'
    );
  }

  return entries.map(parseTweet);
}

/**
 * Read and parse tweets from a Twitter data export zip file.
 */
export async function parseTweetsFromZip(
  zipBuffer: Buffer | ArrayBuffer
): Promise<{
  tweets: ParsedTweet[];
  zip: JSZip;
}> {
  const zip = await JSZip.loadAsync(zipBuffer);

  // Find tweets.js — may be at root or in data/ directory
  const tweetsFile =
    zip.file('data/tweets.js') ??
    zip.file('tweets.js') ??
    (zip.file(/tweets\.js$/i)[0] as JSZip.JSZipObject | undefined) ??
    undefined;

  if (!tweetsFile) {
    throw new Error(
      'Could not find tweets.js in the archive. Expected at data/tweets.js or tweets.js.'
    );
  }

  const content = await tweetsFile.async('string');
  const tweets = parseTweetsJs(content);

  return { tweets, zip };
}
