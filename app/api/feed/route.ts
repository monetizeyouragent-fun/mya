export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter, withRateLimitHeaders, getGetRateLimitInfo } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM feed_events ORDER BY created_at DESC LIMIT 20',
      args: [],
    });

    return withRateLimitHeaders(NextResponse.json({ data: result.rows }), getGetRateLimitInfo(request));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
