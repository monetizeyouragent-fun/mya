import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { validateBody } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { autoRespond } from '@/lib/support-auto';

export const dynamic = 'force-dynamic';

const replyLimiter = rateLimit({ limit: 10, windowMs: 3600_000, prefix: 'support-reply' });

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const limited = replyLimiter(request);
  if (limited) return limited;

  const { ticketId } = params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const validated = validateBody(body, ['message', 'sender_name']);
  if ('error' in validated) return validated.error;
  const data = validated.data;

  const message = data.message as string;
  const senderName = data.sender_name as string;

  // Check ticket exists
  const ticketResult = await db.execute({
    sql: `SELECT * FROM support_tickets WHERE ticket_id = ?`,
    args: [ticketId],
  });

  if (ticketResult.rows.length === 0) {
    return NextResponse.json({ error: 'Ticket not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const ticket = ticketResult.rows[0];

  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Ticket is closed', code: 'TICKET_CLOSED' }, { status: 400 });
  }

  // Save user message
  await db.execute({
    sql: `INSERT INTO ticket_messages (ticket_id, sender, sender_type, message) VALUES (?, ?, ?, ?)`,
    args: [ticketId, senderName, 'user', message],
  });

  // Re-run auto-responder
  const auto = await autoRespond(ticket.subject as string, message, senderName);

  let autoResponse: string | null = null;
  if (auto.autoResolved) {
    autoResponse = auto.response;
    await db.execute({
      sql: `INSERT INTO ticket_messages (ticket_id, sender, sender_type, message) VALUES (?, ?, ?, ?)`,
      args: [ticketId, 'System', 'auto', auto.response],
    });
  }

  // Update timestamp
  await db.execute({
    sql: `UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
    args: [ticketId],
  });

  return NextResponse.json({
    success: true,
    ticket_id: ticketId,
    auto_response: autoResponse,
  });
}
