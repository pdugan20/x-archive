import type { Json } from '@/types/database';

/**
 * Types representing the Twitter data export format.
 * The export zip contains tweets.js with the structure:
 * window.YTD.tweet.part0 = [ { tweet: { ... } }, ... ]
 */

export interface TwitterExportTweet {
  tweet: {
    id_str: string;
    full_text: string;
    created_at: string; // "Mon Jan 01 12:00:00 +0000 2024"
    retweet_count: string;
    favorite_count: string;
    reply_count?: string;
    quote_count?: string;
    in_reply_to_status_id_str?: string | null;
    in_reply_to_user_id_str?: string | null;
    in_reply_to_screen_name?: string | null;
    conversation_id_str?: string;
    source?: string;
    lang?: string;
    entities: TwitterEntities;
    extended_entities?: {
      media?: TwitterMediaEntity[];
    };
  };
}

export interface TwitterEntities {
  urls?: TwitterUrlEntity[];
  hashtags?: TwitterHashtagEntity[];
  user_mentions?: TwitterMentionEntity[];
  media?: TwitterMediaEntity[];
  symbols?: TwitterSymbolEntity[];
}

export interface TwitterUrlEntity {
  url: string;
  expanded_url: string;
  display_url: string;
  indices: [number, number];
}

export interface TwitterHashtagEntity {
  text: string;
  indices: [number, number];
}

export interface TwitterMentionEntity {
  screen_name: string;
  id_str: string;
  indices: [number, number];
}

export interface TwitterMediaEntity {
  id_str: string;
  media_url_https: string;
  type: 'photo' | 'video' | 'animated_gif';
  sizes?: {
    large?: { w: number; h: number };
    medium?: { w: number; h: number };
    small?: { w: number; h: number };
  };
  ext_alt_text?: string;
  video_info?: {
    duration_millis?: number;
    variants?: {
      bitrate?: number;
      content_type: string;
      url: string;
    }[];
  };
}

export interface TwitterSymbolEntity {
  text: string;
  indices: [number, number];
}

export interface ParsedTweet {
  id: string;
  tweet_type: 'post' | 'reply' | 'retweet' | 'quote_tweet';
  full_text: string;
  created_at: string; // ISO 8601
  retweet_count: number;
  favorite_count: number;
  reply_count: number;
  quote_count: number;
  in_reply_to_tweet_id: string | null;
  in_reply_to_user_id: string | null;
  in_reply_to_screen_name: string | null;
  quoted_tweet_id: string | null;
  retweeted_tweet_id: string | null;
  conversation_id: string | null;
  source: string | null;
  lang: string | null;
  raw_json: Record<string, Json | undefined>;
  entities: TwitterEntities;
  extended_entities?: { media?: TwitterMediaEntity[] };
}
