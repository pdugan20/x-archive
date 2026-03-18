import type { ParsedTweet } from './types';

interface ThreadAssignment {
  tweetId: string;
  conversationId: string;
  threadPosition: number;
}

/**
 * Reconstruct self-reply threads from parsed tweets.
 *
 * A self-reply thread is a series of tweets where each tweet replies to the
 * previous one, and all are by the same user. The first tweet in the thread
 * (the root) has no in_reply_to or replies to someone else.
 *
 * @param tweets - All parsed tweets
 * @param username - The archive owner's Twitter username (for self-reply detection)
 * @returns Thread assignments (conversation_id + thread_position for each threaded tweet)
 */
export function reconstructThreads(
  tweets: ParsedTweet[],
  username: string
): ThreadAssignment[] {
  const assignments: ThreadAssignment[] = [];
  const tweetMap = new Map(tweets.map((t) => [t.id, t]));
  const lowerUsername = username.toLowerCase();

  // Find tweets that are self-replies (reply to own tweet that exists in archive)
  const selfReplies = new Set<string>();
  for (const tweet of tweets) {
    if (
      tweet.in_reply_to_tweet_id &&
      tweet.in_reply_to_screen_name?.toLowerCase() === lowerUsername &&
      tweetMap.has(tweet.in_reply_to_tweet_id)
    ) {
      selfReplies.add(tweet.id);
    }
  }

  // Build parent -> children map
  const childrenOf = new Map<string, string[]>();
  for (const tweetId of selfReplies) {
    const tweet = tweetMap.get(tweetId);
    if (!tweet?.in_reply_to_tweet_id) continue;

    const parentId = tweet.in_reply_to_tweet_id;
    const children = childrenOf.get(parentId) ?? [];
    children.push(tweetId);
    childrenOf.set(parentId, children);
  }

  // Find thread roots: tweets that have children but are NOT self-replies themselves
  const threadRoots = new Set<string>();
  for (const parentId of childrenOf.keys()) {
    if (!selfReplies.has(parentId)) {
      threadRoots.add(parentId);
    }
  }

  // Walk each thread from root, assigning positions
  for (const rootId of threadRoots) {
    const root = tweetMap.get(rootId);
    if (!root) continue;

    const conversationId = root.conversation_id ?? rootId;
    let position = 0;

    // Assign root
    assignments.push({
      tweetId: rootId,
      conversationId,
      threadPosition: position,
    });

    // Walk the chain — at each level, pick the child tweet
    // (threads are linear; if multiple children exist, sort by date)
    let currentId: string | undefined = rootId;
    while (currentId) {
      const children = childrenOf.get(currentId);
      if (!children || children.length === 0) break;

      // Sort children by creation date (earliest first)
      children.sort((a, b) => {
        const tweetA = tweetMap.get(a);
        const tweetB = tweetMap.get(b);
        if (!tweetA || !tweetB) return 0;
        return (
          new Date(tweetA.created_at).getTime() -
          new Date(tweetB.created_at).getTime()
        );
      });

      // Assign each child in order
      for (const childId of children) {
        position++;
        assignments.push({
          tweetId: childId,
          conversationId,
          threadPosition: position,
        });
      }

      // Continue with the last child (main thread continuation)
      currentId = children[children.length - 1];
    }
  }

  return assignments;
}
