#!/usr/bin/env tsx

/**
 * CLI to import a Twitter data export zip into the x-archive database.
 *
 * Usage:
 *   npm run import -- --file ~/Downloads/twitter-archive.zip
 *   npm run import -- --file ~/Downloads/twitter-archive.zip --username doog --skip-media
 */

import { upsertEntities } from '@/lib/db/entities';
import { upsertMedia } from '@/lib/db/media';
import { updateSettings } from '@/lib/db/settings';
import { upsertTweets } from '@/lib/db/tweets';
import { extractAllEntities } from '@/lib/import/entity-extractor';
import {
  downloadAllMedia,
  extractMediaRecords,
} from '@/lib/import/media-downloader';
import { parseTweetsFromZip } from '@/lib/import/parser';
import { reconstructThreads } from '@/lib/import/thread-reconstructor';
import type { TablesInsert } from '@/types/database';
import * as fs from 'fs';
import * as path from 'path';

// -- Argument parsing --

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return args[index + 1];
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const filePath = getArg('file');
const username = getArg('username') ?? 'doog';
const skipMedia = hasFlag('skip-media');
const dryRun = hasFlag('dry-run');

if (!filePath) {
  console.error('Usage: npm run import -- --file <path-to-zip>');
  console.error('Options:');
  console.error('  --username <handle>  Your Twitter username (default: doog)');
  console.error(
    '  --skip-media         Skip media download to Supabase Storage'
  );
  console.error(
    '  --dry-run            Parse and log stats without writing to DB'
  );
  process.exit(1);
}

const resolvedPath = path.resolve(filePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

// -- Main --

async function main() {
  console.log(`[INFO] Reading archive: ${resolvedPath}`);
  const zipBuffer = fs.readFileSync(resolvedPath);

  console.log('[INFO] Parsing tweets.js...');
  const { tweets, zip } = await parseTweetsFromZip(zipBuffer);
  console.log(`[INFO] Parsed ${tweets.length} tweets`);

  // Stats
  const typeCounts = { post: 0, reply: 0, retweet: 0, quote_tweet: 0 };
  for (const tweet of tweets) {
    typeCounts[tweet.tweet_type]++;
  }
  console.log(
    `[INFO] Types: ${typeCounts.post} posts, ${typeCounts.reply} replies, ${typeCounts.retweet} retweets, ${typeCounts.quote_tweet} quote tweets`
  );

  // Extract entities
  console.log('[INFO] Extracting entities...');
  const entities = extractAllEntities(tweets);
  const urlCount = entities.filter((e) => e.entity_type === 'url').length;
  const hashtagCount = entities.filter(
    (e) => e.entity_type === 'hashtag'
  ).length;
  const mentionCount = entities.filter(
    (e) => e.entity_type === 'mention'
  ).length;
  console.log(
    `[INFO] Entities: ${urlCount} URLs, ${hashtagCount} hashtags, ${mentionCount} mentions`
  );

  // Extract media records
  console.log('[INFO] Extracting media records...');
  const mediaRecords: TablesInsert<'tweet_media'>[] =
    tweets.flatMap(extractMediaRecords);
  const photoCount = mediaRecords.filter(
    (m) => m.media_type === 'photo'
  ).length;
  const videoCount = mediaRecords.filter(
    (m) => m.media_type === 'video'
  ).length;
  const gifCount = mediaRecords.filter(
    (m) => m.media_type === 'animated_gif'
  ).length;
  console.log(
    `[INFO] Media: ${photoCount} photos, ${videoCount} videos, ${gifCount} GIFs`
  );

  // Reconstruct threads
  console.log('[INFO] Reconstructing threads...');
  const threadAssignments = reconstructThreads(tweets, username);
  const threadedTweets = new Set(threadAssignments.map((a) => a.tweetId));
  const threadCount = new Set(threadAssignments.map((a) => a.conversationId))
    .size;
  console.log(
    `[INFO] Threads: ${threadCount} threads containing ${threadedTweets.size} tweets`
  );

  if (dryRun) {
    console.log('[INFO] Dry run complete. No data written to database.');
    return;
  }

  // Apply thread assignments to tweet data
  const threadMap = new Map(
    threadAssignments.map((a) => [
      a.tweetId,
      { conversationId: a.conversationId, threadPosition: a.threadPosition },
    ])
  );

  // Insert tweets in batches
  const BATCH_SIZE = 500;
  console.log(`[INFO] Inserting tweets in batches of ${BATCH_SIZE}...`);

  const tweetRows: TablesInsert<'tweets'>[] = tweets.map((t) => {
    const thread = threadMap.get(t.id);
    return {
      id: t.id,
      tweet_type: t.tweet_type,
      full_text: t.full_text,
      created_at: t.created_at,
      retweet_count: t.retweet_count,
      favorite_count: t.favorite_count,
      reply_count: t.reply_count,
      quote_count: t.quote_count,
      in_reply_to_tweet_id: t.in_reply_to_tweet_id,
      in_reply_to_user_id: t.in_reply_to_user_id,
      in_reply_to_screen_name: t.in_reply_to_screen_name,
      quoted_tweet_id: t.quoted_tweet_id,
      retweeted_tweet_id: t.retweeted_tweet_id,
      conversation_id: thread?.conversationId ?? t.conversation_id,
      thread_position: thread?.threadPosition ?? null,
      source: t.source,
      lang: t.lang,
      raw_json: t.raw_json as import('@/types/database').Json,
      import_source: 'export' as const,
    };
  });

  for (let i = 0; i < tweetRows.length; i += BATCH_SIZE) {
    const batch = tweetRows.slice(i, i + BATCH_SIZE);
    const { error } = await upsertTweets(batch);
    if (error) {
      console.error(
        `[ERROR] Failed to insert tweets batch ${i}-${i + batch.length}: ${error.message}`
      );
    } else {
      console.log(
        `[INFO] Inserted tweets ${i + 1}-${i + batch.length} of ${tweetRows.length}`
      );
    }
  }

  // Insert entities in batches
  console.log('[INFO] Inserting entities...');
  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);
    const { error } = await upsertEntities(batch);
    if (error) {
      console.error(
        `[ERROR] Failed to insert entities batch: ${error.message}`
      );
    }
  }
  console.log(`[INFO] Inserted ${entities.length} entities`);

  // Insert media records (without storage paths yet)
  console.log('[INFO] Inserting media records...');
  if (mediaRecords.length > 0) {
    const { error } = await upsertMedia(mediaRecords);
    if (error) {
      console.error(`[ERROR] Failed to insert media records: ${error.message}`);
    } else {
      console.log(`[INFO] Inserted ${mediaRecords.length} media records`);
    }
  }

  // Download and upload media to Supabase Storage
  if (!skipMedia && mediaRecords.length > 0) {
    console.log('[INFO] Downloading media to Supabase Storage...');
    const mediaResults = await downloadAllMedia(
      tweets,
      zip,
      (completed, total) => {
        console.log(
          `[INFO] Media progress: ${completed}/${total} tweets processed`
        );
      }
    );

    // Update media records with storage paths
    const supabase = (await import('@/lib/db/supabase')).getSupabaseAdmin();
    let uploaded = 0;
    for (const [tweetId, mediaMap] of mediaResults) {
      for (const [mediaId, paths] of mediaMap) {
        const updates: Record<string, string> = {};
        if (paths.storagePath) {
          updates['storage_path'] = paths.storagePath;
          uploaded++;
        }
        if (paths.thumbnailPath) {
          updates['thumbnail_storage_path'] = paths.thumbnailPath;
          uploaded++;
        }
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('tweet_media')
            .update(updates)
            .eq('id', mediaId)
            .eq('tweet_id', tweetId);
        }
      }
    }
    console.log(`[INFO] Uploaded ${uploaded} media files to storage`);
  } else if (skipMedia) {
    console.log('[INFO] Skipping media download (--skip-media flag)');
  }

  // Update settings with username
  await updateSettings({ x_username: username });

  console.log('[SUCCESS] Import complete!');
  console.log(`  Tweets: ${tweetRows.length}`);
  console.log(`  Entities: ${entities.length}`);
  console.log(`  Media: ${mediaRecords.length}`);
  console.log(`  Threads: ${threadCount}`);
}

main().catch((err: unknown) => {
  console.error('[ERROR] Import failed:', err);
  process.exit(1);
});
