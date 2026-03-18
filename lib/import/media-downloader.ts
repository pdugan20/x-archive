import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { TablesInsert } from '@/types/database';
import type JSZip from 'jszip';
import type { ParsedTweet, TwitterMediaEntity } from './types';

const BUCKET = 'tweet-media';
const CONCURRENCY_LIMIT = 5;

/**
 * Extract media records from a parsed tweet into rows for the tweet_media table.
 */
export function extractMediaRecords(
  tweet: ParsedTweet
): TablesInsert<'tweet_media'>[] {
  // Prefer extended_entities.media (includes all photos in multi-photo tweets)
  const mediaEntities =
    tweet.extended_entities?.media ?? tweet.entities.media ?? [];

  return mediaEntities.map((media: TwitterMediaEntity) => {
    const bestVideoUrl = getBestVideoUrl(media);
    const size = media.sizes?.large ?? media.sizes?.medium;

    return {
      id: media.id_str,
      tweet_id: tweet.id,
      media_type: media.type,
      original_url: media.media_url_https,
      width: size?.w ?? null,
      height: size?.h ?? null,
      alt_text: media.ext_alt_text ?? null,
      duration_ms: media.video_info?.duration_millis ?? null,
      video_url: bestVideoUrl,
    };
  });
}

function getBestVideoUrl(media: TwitterMediaEntity): string | null {
  if (!media.video_info?.variants) return null;

  // Find highest bitrate MP4 variant
  const mp4Variants = media.video_info.variants
    .filter((v) => v.content_type === 'video/mp4' && v.bitrate != null)
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

  return mp4Variants[0]?.url ?? null;
}

/**
 * Find a media file in the Twitter export zip.
 * Files are in tweets_media/ with format: <tweet_id>-<media_id>.<ext>
 */
async function findMediaInZip(
  zip: JSZip,
  tweetId: string,
  mediaId: string
): Promise<Buffer | null> {
  // Try common patterns
  const patterns = [
    `tweets_media/${tweetId}-${mediaId}`,
    `data/tweets_media/${tweetId}-${mediaId}`,
  ];

  for (const prefix of patterns) {
    // Try common extensions
    for (const ext of ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4']) {
      const file = zip.file(prefix + ext);
      if (file) {
        const buffer = await file.async('nodebuffer');
        return buffer;
      }
    }
  }

  // Try regex match in case of different naming
  const regex = new RegExp(`${tweetId}.*${mediaId}`, 'i');
  const matches = zip.file(regex);
  if (matches.length > 0) {
    return matches[0].async('nodebuffer');
  }

  return null;
}

function getContentType(filename: string): string {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.gif')) return 'image/gif';
  if (filename.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Upload a single media file to Supabase Storage.
 * Returns the storage path on success, null on failure.
 */
async function uploadToStorage(
  buffer: Buffer,
  storagePath: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const contentType = getContentType(storagePath);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Failed to upload ${storagePath}: ${error.message}`);
    return null;
  }

  return storagePath;
}

/**
 * Download media for a tweet from the export zip and upload to Supabase Storage.
 * For photos: uploads the full image.
 * For videos: uploads only the thumbnail (the image file in the export).
 */
export async function downloadTweetMedia(
  tweet: ParsedTweet,
  zip: JSZip,
  onProgress?: (mediaId: string, success: boolean) => void
): Promise<Map<string, { storagePath?: string; thumbnailPath?: string }>> {
  const results = new Map<
    string,
    { storagePath?: string; thumbnailPath?: string }
  >();
  const mediaRecords = extractMediaRecords(tweet);

  for (const record of mediaRecords) {
    const buffer = await findMediaInZip(zip, tweet.id, record.id);

    if (!buffer) {
      onProgress?.(record.id, false);
      results.set(record.id, {});
      continue;
    }

    if (record.media_type === 'photo') {
      const path = `images/${tweet.id}/${record.id}.jpg`;
      const storagePath = await uploadToStorage(buffer, path);
      results.set(record.id, { storagePath: storagePath ?? undefined });
    } else {
      // Video/GIF: the file in the export zip is the thumbnail image
      const path = `thumbnails/${tweet.id}/${record.id}.jpg`;
      const thumbnailPath = await uploadToStorage(buffer, path);
      results.set(record.id, {
        thumbnailPath: thumbnailPath ?? undefined,
      });
    }

    onProgress?.(record.id, true);
  }

  return results;
}

/**
 * Process media for multiple tweets with concurrency limiting.
 */
export async function downloadAllMedia(
  tweets: ParsedTweet[],
  zip: JSZip,
  onProgress?: (completed: number, total: number) => void
): Promise<
  Map<string, Map<string, { storagePath?: string; thumbnailPath?: string }>>
> {
  const allResults = new Map<
    string,
    Map<string, { storagePath?: string; thumbnailPath?: string }>
  >();

  // Only process tweets that have media
  const tweetsWithMedia = tweets.filter((t) => {
    const media = t.extended_entities?.media ?? t.entities.media ?? [];
    return media.length > 0;
  });

  let completed = 0;
  const total = tweetsWithMedia.length;

  // Process in batches for concurrency control
  for (let i = 0; i < tweetsWithMedia.length; i += CONCURRENCY_LIMIT) {
    const batch = tweetsWithMedia.slice(i, i + CONCURRENCY_LIMIT);
    const results = await Promise.all(
      batch.map((tweet) => downloadTweetMedia(tweet, zip))
    );

    for (let j = 0; j < batch.length; j++) {
      allResults.set(batch[j].id, results[j]);
    }

    completed += batch.length;
    onProgress?.(completed, total);
  }

  return allResults;
}
