import { getOAuthHeader } from './oauth';
import { updateRateLimit, waitForRateLimit } from './rate-limiter';

const BASE_URL = 'https://api.x.com/2';

interface XApiResponse<T> {
  data?: T;
  errors?: { message: string; type: string }[];
  meta?: {
    result_count?: number;
    next_token?: string;
    oldest_id?: string;
    newest_id?: string;
  };
  includes?: {
    media?: XMediaObject[];
  };
}

export interface XTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
  conversation_id?: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: {
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }[];
  entities?: {
    urls?: {
      start: number;
      end: number;
      url: string;
      expanded_url: string;
      display_url: string;
      title?: string;
    }[];
    hashtags?: { start: number; end: number; tag: string }[];
    mentions?: { start: number; end: number; username: string; id: string }[];
    cashtags?: { start: number; end: number; tag: string }[];
  };
  attachments?: {
    media_keys?: string[];
  };
  source?: string;
  lang?: string;
}

export interface XMediaObject {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  duration_ms?: number;
}

/**
 * Make an authenticated request to the X API v2.
 */
async function xApiFetch<T>(
  method: string,
  path: string,
  queryParams?: Record<string, string>
): Promise<XApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }
  }

  // Strip query params for OAuth signature (they're added separately)
  const baseUrl = `${url.origin}${url.pathname}`;
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  await waitForRateLimit(path);

  const authHeader = getOAuthHeader(method, baseUrl, params);

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });

  updateRateLimit(path, response.headers);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `X API ${method} ${path} failed (${response.status}): ${errorBody}`
    );
  }

  return response.json() as Promise<XApiResponse<T>>;
}

/**
 * Get the authenticated user's profile.
 */
export async function getMe(): Promise<{
  id: string;
  username: string;
  name: string;
}> {
  const response = await xApiFetch<{
    id: string;
    username: string;
    name: string;
  }>('GET', '/users/me');

  if (!response.data) {
    throw new Error('Failed to get user profile');
  }

  return response.data;
}

/**
 * Get the authenticated user's tweets.
 */
export async function getUserTweets(
  userId: string,
  options: {
    sinceId?: string;
    maxResults?: number;
    paginationToken?: string;
  } = {}
): Promise<{
  tweets: XTweet[];
  media: XMediaObject[];
  nextToken?: string;
}> {
  const params: Record<string, string> = {
    'tweet.fields':
      'created_at,public_metrics,conversation_id,in_reply_to_user_id,entities,source,lang,referenced_tweets,attachments',
    'media.fields':
      'url,preview_image_url,width,height,alt_text,duration_ms,type',
    expansions: 'attachments.media_keys,referenced_tweets.id',
    max_results: String(options.maxResults ?? 100),
  };

  if (options.sinceId) {
    params['since_id'] = options.sinceId;
  }

  if (options.paginationToken) {
    params['pagination_token'] = options.paginationToken;
  }

  const response = await xApiFetch<XTweet[]>(
    'GET',
    `/users/${userId}/tweets`,
    params
  );

  return {
    tweets: response.data ?? [],
    media: response.includes?.media ?? [],
    nextToken: response.meta?.next_token,
  };
}

/**
 * Delete a tweet by ID.
 */
export async function deleteTweet(
  tweetId: string
): Promise<{ deleted: boolean }> {
  const response = await xApiFetch<{ deleted: boolean }>(
    'DELETE',
    `/tweets/${tweetId}`
  );

  return response.data ?? { deleted: false };
}

/**
 * Undo a retweet. Different endpoint from deleting a tweet.
 */
export async function undoRetweet(
  userId: string,
  tweetId: string
): Promise<{ retweeted: boolean }> {
  const response = await xApiFetch<{ retweeted: boolean }>(
    'DELETE',
    `/users/${userId}/retweets/${tweetId}`
  );

  return response.data ?? { retweeted: false };
}
