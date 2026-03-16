import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitInfo } from '@/lib/rate-limit';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const securityHeaders: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://api.fontshare.com; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https://api.fontshare.com https://cdn.fontshare.com",
};

export function middleware(request: NextRequest) {
  // Handle preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: { ...corsHeaders, ...securityHeaders } });
  }

  const response = NextResponse.next();

  // CORS headers
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  // Security headers (Issue 25)
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // X-Request-Id (Issue 21)
  response.headers.set('X-Request-Id', crypto.randomUUID());

  // Rate limit headers on ALL responses (Issue 19)
  if (request.method === 'POST') {
    const info = getRateLimitInfo(request, 'post', 10, 60_000);
    response.headers.set('X-RateLimit-Limit', String(info.limit));
    response.headers.set('X-RateLimit-Remaining', String(info.remaining));
    response.headers.set('X-RateLimit-Reset', String(info.reset));
  } else if (request.method === 'GET') {
    const info = getRateLimitInfo(request, 'get', 60, 60_000);
    response.headers.set('X-RateLimit-Limit', String(info.limit));
    response.headers.set('X-RateLimit-Remaining', String(info.remaining));
    response.headers.set('X-RateLimit-Reset', String(info.reset));
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
