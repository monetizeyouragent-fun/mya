export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createHash } from 'crypto';
import { postLimiter } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';

export async function POST(request: NextRequest) {
  const limited = postLimiter(request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const { entry_id, direction } = body;

  if (!entry_id || !['up', 'down'].includes(direction as string)) {
    return errorResponse('entry_id and direction (up/down) are required', 'VALIDATION_ERROR', 400);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
  const fingerprint = createHash('sha256').update(ip).digest('hex').slice(0, 16);

  try {
    // Verify entry exists before voting
    const entryCheck = await db.execute({
      sql: 'SELECT id FROM entries WHERE id = ?',
      args: [entry_id as number],
    });
    if (entryCheck.rows.length === 0) {
      return errorResponse('Entry not found', 'NOT_FOUND', 404);
    }

    // Check for existing vote
    const existing = await db.execute({
      sql: 'SELECT id, direction FROM votes WHERE entry_id = ? AND voter_fingerprint = ?',
      args: [entry_id as number, fingerprint],
    });

    if (existing.rows.length > 0) {
      const prev = existing.rows[0];
      await db.execute({ sql: 'DELETE FROM votes WHERE id = ?', args: [prev.id] });
      const col = prev.direction === 'up' ? 'votes_up' : 'votes_down';
      await db.execute({ sql: `UPDATE entries SET ${col} = ${col} - 1 WHERE id = ?`, args: [entry_id as number] });

      if (prev.direction === direction) {
        return NextResponse.json({ success: true, action: 'removed' });
      }
    }

    // Add new vote
    await db.execute({
      sql: 'INSERT INTO votes (entry_id, voter_fingerprint, direction) VALUES (?, ?, ?)',
      args: [entry_id as number, fingerprint, direction as string],
    });

    const col = direction === 'up' ? 'votes_up' : 'votes_down';
    await db.execute({ sql: `UPDATE entries SET ${col} = ${col} + 1 WHERE id = ?`, args: [entry_id as number] });

    // Get entry name for feed
    const entryResult = await db.execute({ sql: 'SELECT name FROM entries WHERE id = ?', args: [entry_id as number] });
    const entryName = entryResult.rows.length > 0 ? String(entryResult.rows[0].name) : `Entry #${entry_id}`;

    await insertFeedEvent('vote', fingerprint.slice(0, 8), entryName, { direction, entry_id });

    return NextResponse.json({ success: true, action: 'voted', direction });
  } catch {
    return errorResponse('Failed to process vote', 'INTERNAL_ERROR', 500);
  }
}
