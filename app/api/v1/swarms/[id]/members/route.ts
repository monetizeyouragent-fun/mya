export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter, getGetRateLimitInfo, withRateLimitHeaders } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const limited = getLimiter(request);
  if (limited) return limited;

  const swarmId = parseInt(params.id);
  if (isNaN(swarmId)) {
    return errorResponse('Invalid swarm ID', 'VALIDATION_ERROR', 400);
  }

  try {
    // Verify swarm exists
    const swarmResult = await db.execute({
      sql: 'SELECT id, name FROM swarms WHERE id = ?',
      args: [swarmId],
    });

    if (swarmResult.rows.length === 0) {
      return errorResponse('Swarm not found', 'NOT_FOUND', 404);
    }

    // Get members with relevant statuses
    const membersResult = await db.execute({
      sql: `SELECT applicant_name, applicant_type, status, created_at
            FROM applications
            WHERE type = 'swarm_join' AND target_id = ? AND status IN ('pending', 'accepted', 'waitlisted')
            ORDER BY created_at ASC`,
      args: [swarmId],
    });

    // Count by status
    const countResult = await db.execute({
      sql: `SELECT
              SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as approved_count,
              SUM(CASE WHEN status IN ('pending', 'waitlisted') THEN 1 ELSE 0 END) as pending_count
            FROM applications
            WHERE type = 'swarm_join' AND target_id = ?`,
      args: [swarmId],
    });

    const counts = countResult.rows[0];

    return withRateLimitHeaders(
      NextResponse.json({
        swarm_id: swarmId,
        approved_members: membersResult.rows,
        approved_count: Number(counts.approved_count) || 0,
        pending_count: Number(counts.pending_count) || 0,
      }),
      getGetRateLimitInfo(request)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
