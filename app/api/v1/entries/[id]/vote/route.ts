export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter, withRateLimitHeaders, getPostRateLimitInfo } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const { direction, voter } = body;

  // Validate direction BEFORE rate limiting
  if (!direction || !['up', 'down'].includes(direction as string)) {
    return errorResponse('direction must be "up" or "down"', 'VALIDATION_ERROR', 400);
  }

  if (!voter || typeof voter !== 'string') {
    return errorResponse('voter is required', 'VALIDATION_ERROR', 400);
  }

  const limited = postLimiter(request);
  if (limited) return limited;

  try {
    // Verify entry exists
    const entryCheck = await db.execute({
      sql: 'SELECT id, votes_up, votes_down FROM entries WHERE id = ? AND status = ?',
      args: [id, 'active'],
    });

    if (entryCheck.rows.length === 0) {
      return errorResponse('Entry not found', 'NOT_FOUND', 404);
    }

    // Update vote count
    const col = direction === 'up' ? 'votes_up' : 'votes_down';
    await db.execute({
      sql: `UPDATE entries SET ${col} = ${col} + 1 WHERE id = ?`,
      args: [id],
    });

    // Get updated counts
    const updated = await db.execute({
      sql: 'SELECT votes_up, votes_down FROM entries WHERE id = ?',
      args: [id],
    });

    return withRateLimitHeaders(
      NextResponse.json({
        success: true,
        votes_up: Number(updated.rows[0].votes_up),
        votes_down: Number(updated.rows[0].votes_down),
      }),
      getPostRateLimitInfo(request)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
