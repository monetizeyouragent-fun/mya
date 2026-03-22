import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
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

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export function rateLimit(opts: { limit: number; windowMs: number; prefix?: string }) {
  const { limit, windowMs, prefix = 'default' } = opts;
  if (!stores.has(prefix)) stores.set(prefix, new Map());
  const store = stores.get(prefix)!;
  ensureCleanup();

  return function check(request: NextRequest): NextResponse | null {
    const ip = getIp(request);
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
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null; // allowed
  };
}

/** Get rate limit info for attaching to successful responses */
export function getRateLimitInfo(
  request: NextRequest,
  prefix: string,
  limit: number,
  windowMs: number
): RateLimitInfo {
  const store = stores.get(prefix);
  const ip = getIp(request);
  const now = Date.now();

  if (!store) {
    return { limit, remaining: limit, reset: Math.ceil((now + windowMs) / 1000) };
  }

  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    return { limit, remaining: limit - 1, reset: Math.ceil((now + windowMs) / 1000) };
  }

  return {
    limit,
    remaining: Math.max(0, limit - entry.count),
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

/** Attach rate limit headers to a response */
export function withRateLimitHeaders(response: NextResponse, info: RateLimitInfo): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(info.limit));
  response.headers.set('X-RateLimit-Remaining', String(info.remaining));
  response.headers.set('X-RateLimit-Reset', String(info.reset));
  return response;
}

// Pre-configured limiters
export const postLimiter = rateLimit({ limit: 5, windowMs: 60_000, prefix: 'post' });
export const getLimiter = rateLimit({ limit: 60, windowMs: 60_000, prefix: 'get' });

// Pre-configured info getters
export function getPostRateLimitInfo(request: NextRequest): RateLimitInfo {
  return getRateLimitInfo(request, 'post', 10, 60_000);
}
export function getGetRateLimitInfo(request: NextRequest): RateLimitInfo {
  return getRateLimitInfo(request, 'get', 60, 60_000);
}
