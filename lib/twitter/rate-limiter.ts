interface RateLimitState {
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
  limit: number;
}

const rateLimits = new Map<string, RateLimitState>();

/**
 * Update rate limit state from X API response headers.
 */
export function updateRateLimit(endpoint: string, headers: Headers): void {
  const remaining = headers.get('x-rate-limit-remaining');
  const reset = headers.get('x-rate-limit-reset');
  const limit = headers.get('x-rate-limit-limit');

  if (remaining != null && reset != null) {
    rateLimits.set(endpoint, {
      remaining: parseInt(remaining, 10),
      resetAt: parseInt(reset, 10),
      limit: limit ? parseInt(limit, 10) : 0,
    });
  }
}

/**
 * Check if we should wait before making a request to an endpoint.
 * Returns the number of milliseconds to wait, or 0 if safe to proceed.
 */
export function getWaitTime(endpoint: string): number {
  const state = rateLimits.get(endpoint);
  if (!state) return 0;

  if (state.remaining <= 1) {
    const now = Math.floor(Date.now() / 1000);
    const waitSeconds = state.resetAt - now;
    if (waitSeconds > 0) {
      return waitSeconds * 1000;
    }
  }

  return 0;
}

/**
 * Get current rate limit info for logging/display.
 */
export function getRateLimitInfo(endpoint: string): RateLimitState | undefined {
  return rateLimits.get(endpoint);
}

/**
 * Wait if rate-limited, then proceed.
 */
export async function waitForRateLimit(endpoint: string): Promise<void> {
  const waitMs = getWaitTime(endpoint);
  if (waitMs > 0) {
    console.warn(
      `[RATE_LIMIT] Waiting ${Math.ceil(waitMs / 1000)}s for ${endpoint} rate limit reset`
    );
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}
