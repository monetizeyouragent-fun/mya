import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter, withRateLimitHeaders, getGetRateLimitInfo } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const limited = getLimiter(request);
  if (limited) return limited;

  const { ticketId } = params;

  const ticketResult = await db.execute({
    sql: `SELECT * FROM support_tickets WHERE ticket_id = ?`,
    args: [ticketId],
  });

  if (ticketResult.rows.length === 0) {
    return NextResponse.json({ error: 'Ticket not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const messagesResult = await db.execute({
    sql: `SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
    args: [ticketId],
  });

  return withRateLimitHeaders(NextResponse.json({
    ticket: ticketResult.rows[0],
    messages: messagesResult.rows,
  }), getGetRateLimitInfo(request));
}
