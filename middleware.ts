import { NextRequest, NextResponse } from 'next/server';

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
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: { ...corsHeaders, ...securityHeaders } });
  }

  const response = NextResponse.next();

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  response.headers.set('X-Request-Id', crypto.randomUUID());

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
