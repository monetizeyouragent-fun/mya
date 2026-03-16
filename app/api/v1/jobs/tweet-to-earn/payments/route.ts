export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter, getGetRateLimitInfo, withRateLimitHeaders } from '@/lib/rate-limit';
import { parsePagination, paginatedResponse, errorResponse } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get('status'); // paid, verified, pending, rejected

    let countSql = 'SELECT COUNT(*) as total FROM tweet_submissions';
    let dataSql = 'SELECT id, tweet_url, tweet_id, author_username, wallet_address, reward_amount, verification_status, tx_hash, verified_at, paid_at, created_at FROM tweet_submissions';
    if (status) {
      countSql += ' WHERE verification_status = ?';
      dataSql += ' WHERE verification_status = ?';
    }

    dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const countResult = status
      ? await db.execute({ sql: countSql, args: [status] })
      : await db.execute(countSql);
    const totalCount = Number(countResult.rows[0].total);

    const result = status
      ? await db.execute({ sql: dataSql, args: [status, limit, offset] })
      : await db.execute({ sql: dataSql, args: [limit, offset] });

    const response = NextResponse.json(paginatedResponse(result.rows, totalCount, page, limit));
    return withRateLimitHeaders(response, getGetRateLimitInfo(request));
  } catch {
    return errorResponse('Failed to fetch payments', 'INTERNAL_ERROR', 500);
  }
}
