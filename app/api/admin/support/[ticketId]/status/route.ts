import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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

  const status = body.status as string;
  const validStatuses = ['open', 'auto_resolved', 'escalated', 'resolved', 'closed'];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}`, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const ticketResult = await db.execute({
    sql: `SELECT * FROM support_tickets WHERE ticket_id = ?`,
    args: [ticketId],
  });

  if (ticketResult.rows.length === 0) {
    return NextResponse.json({ error: 'Ticket not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  await db.execute({
    sql: `UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
    args: [status, ticketId],
  });

  return NextResponse.json({ success: true, ticket_id: ticketId, status });
}
