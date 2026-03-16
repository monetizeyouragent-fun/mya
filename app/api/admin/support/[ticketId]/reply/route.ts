import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const secret = request.headers.get('x-auth-secret');
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ticketId } = params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const validated = validateBody(body, ['message']);
  if ('error' in validated) return validated.error;
  const data = validated.data;

  const message = data.message as string;
  const resolve = body.resolve === true;

  // Check ticket exists
  const ticketResult = await db.execute({
    sql: `SELECT * FROM support_tickets WHERE ticket_id = ?`,
    args: [ticketId],
  });

  if (ticketResult.rows.length === 0) {
    return NextResponse.json({ error: 'Ticket not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  // Save admin message
  await db.execute({
    sql: `INSERT INTO ticket_messages (ticket_id, sender, sender_type, message) VALUES (?, ?, ?, ?)`,
    args: [ticketId, 'Admin', 'admin', message],
  });

  // Update status if resolving
  const newStatus = resolve ? 'resolved' : ticketResult.rows[0].status;
  await db.execute({
    sql: `UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
    args: [newStatus, ticketId],
  });

  return NextResponse.json({ success: true, status: newStatus });
}
