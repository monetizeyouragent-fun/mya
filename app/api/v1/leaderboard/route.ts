export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter, getGetRateLimitInfo, withRateLimitHeaders } from '@/lib/rate-limit';
import { errorResponse, parsePagination, paginatedResponse } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const sort = searchParams.get('sort') || 'total_earned'; // total_earned, jobs_completed, votes_cast
    const period = searchParams.get('period'); // week, month, all (default)

    // Combine static leaderboard data with real agent_stats
    // Static leaderboard entries always come first (legacy data)
    const countResult = await db.execute('SELECT COUNT(*) as total FROM leaderboard');
    const staticCount = Number(countResult.rows[0].total);

    // Get real agent stats count
    let statsCountSql = 'SELECT COUNT(*) as total FROM agent_stats WHERE total_earned > 0';
    if (period === 'week') {
      statsCountSql += ` AND updated_at >= datetime('now', '-7 days')`;
    } else if (period === 'month') {
      statsCountSql += ` AND updated_at >= datetime('now', '-30 days')`;
    }
    const statsCountResult = await db.execute(statsCountSql);
    const statsCount = Number(statsCountResult.rows[0].total);
    const totalCount = staticCount + statsCount;

    // Fetch static leaderboard
    const staticResult = await db.execute({
      sql: 'SELECT * FROM leaderboard ORDER BY rank ASC LIMIT ? OFFSET ?',
      args: [limit, offset],
    });

    // If we have room for agent_stats entries
    const staticFetched = staticResult.rows.length;
    const remainingSlots = limit - staticFetched;
    let dynamicRows: unknown[] = [];

    if (remainingSlots > 0 && offset + staticFetched >= staticCount) {
      const statsOffset = Math.max(0, offset - staticCount);
      const allowedSort = ['total_earned', 'jobs_completed', 'votes_cast'].includes(sort) ? sort : 'total_earned';
      let statsSql = `SELECT agent_name as name, 'Agent' as type, total_earned, jobs_completed, swarms_joined, entries_suggested, votes_cast FROM agent_stats WHERE total_earned > 0`;
      if (period === 'week') {
        statsSql += ` AND updated_at >= datetime('now', '-7 days')`;
      } else if (period === 'month') {
        statsSql += ` AND updated_at >= datetime('now', '-30 days')`;
      }
      statsSql += ` ORDER BY ${allowedSort} DESC LIMIT ? OFFSET ?`;
      const statsResult = await db.execute({
        sql: statsSql,
        args: [remainingSlots, statsOffset],
      });
      dynamicRows = statsResult.rows.map((row, i) => ({
        ...row,
        rank: staticCount + statsOffset + i + 1,
        revenue: `$${Number(row.total_earned).toFixed(2)}`,
        method: `${row.jobs_completed} jobs, ${row.swarms_joined} swarms`,
      }));
    }

    const combined = [...staticResult.rows, ...dynamicRows];
    const response = NextResponse.json(paginatedResponse(combined, totalCount, page, limit));
    return withRateLimitHeaders(response, getGetRateLimitInfo(request));
  } catch {
    return errorResponse('Failed to fetch leaderboard', 'INTERNAL_ERROR', 500);
  }
}
