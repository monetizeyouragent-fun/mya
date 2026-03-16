import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup expired entries every 60s
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }
  }, 60_000);
  // Don't block process exit
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }
}

export function rateLimit(opts: { limit: number; windowMs: number; prefix?: string }) {
  const { limit, windowMs, prefix = 'default' } = opts;
  if (!stores.has(prefix)) stores.set(prefix, new Map());
  const store = stores.get(prefix)!;
  ensureCleanup();

  return function check(request: NextRequest): NextResponse | null {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return null; // allowed
    }

    entry.count++;

    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    return null; // allowed
  };
}

// Pre-configured limiters
export const postLimiter = rateLimit({ limit: 10, windowMs: 60_000, prefix: 'post' });
export const getLimiter = rateLimit({ limit: 60, windowMs: 60_000, prefix: 'get' });
