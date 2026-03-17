export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter, withRateLimitHeaders, getGetRateLimitInfo } from '@/lib/rate-limit';
import { errorResponse, parsePagination, paginatedResponse } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const countResult = await db.execute('SELECT COUNT(*) as total FROM trends');
    const totalCount = Number(countResult.rows[0].total);

    const result = await db.execute({
      sql: 'SELECT * FROM trends ORDER BY sort_order ASC LIMIT ? OFFSET ?',
      args: [limit, offset],
    });

    return withRateLimitHeaders(NextResponse.json(paginatedResponse(result.rows, totalCount, page, limit)), getGetRateLimitInfo(request));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
