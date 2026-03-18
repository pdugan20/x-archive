import { GET } from '@/app/api/health/route';
import { describe, expect, it } from 'vitest';

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});
