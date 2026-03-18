/**
 * Validates the cron job authentication header.
 * Returns true if the request is authorized, false otherwise.
 */
export function validateCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}
