import { AnalysisApiError } from './analysisErrors.js';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const buckets = new Map();

export function checkRateLimit(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]?.trim()
    : forwardedFor?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  const authHeader = req.headers.authorization;
  const userKey = authHeader && authHeader.startsWith('Bearer ')
    ? `user:${authHeader.substring(7)}`
    : `ip:${ip}`;

  const now = Date.now();
  const entries = buckets.get(userKey) || [];
  const recentEntries = entries.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recentEntries.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new AnalysisApiError(429, 'RATE_LIMITED', 'Too many analysis requests. Please wait a moment and try again.');
  }

  recentEntries.push(now);
  buckets.set(userKey, recentEntries);
  return userKey;
}
