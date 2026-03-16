import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { validateBody } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { autoRespond } from '@/lib/support-auto';
import { insertFeedEvent } from '@/lib/feed';

export const dynamic = 'force-dynamic';

const supportLimiter = rateLimit({ limit: 5, windowMs: 3600_000, prefix: 'support' });

function generateTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TKT-${id}`;
}

export async function POST(request: NextRequest) {
  const limited = supportLimiter(request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const validated = validateBody(body, ['subject', 'message', 'submitter_name']);
  if ('error' in validated) return validated.error;
  const data = validated.data;

  const ticketId = generateTicketId();
  const subject = data.subject as string;
  const message = data.message as string;
  const submitterName = data.submitter_name as string;
  const submitterType = (data.submitter_type as string) || 'agent';
  const contact = (data.contact as string) || null;
  const categoryHint = (data.category as string) || null;

  if (submitterType !== 'agent' && submitterType !== 'human') {
    return NextResponse.json({ error: 'submitter_type must be agent or human', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  // Run auto-responder
  const auto = await autoRespond(subject, message, submitterName);
  const category = categoryHint && ['general', 'payment', 'verification', 'bug', 'feature', 'swarm', 'job', 'account'].includes(categoryHint)
    ? categoryHint
    : auto.category;
  const status = auto.autoResolved ? 'auto_resolved' : 'escalated';
  const priority = auto.priority;

  // Save ticket
  await db.execute({
    sql: `INSERT INTO support_tickets (ticket_id, subject, category, status, priority, submitter_name, submitter_type, contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [ticketId, subject, category, status, priority, submitterName, submitterType, contact],
  });

  // Save first message
  await db.execute({
    sql: `INSERT INTO ticket_messages (ticket_id, sender, sender_type, message) VALUES (?, ?, ?, ?)`,
    args: [ticketId, submitterName, 'user', message],
  });

  // Save auto-response
  if (auto.response) {
    await db.execute({
      sql: `INSERT INTO ticket_messages (ticket_id, sender, sender_type, message) VALUES (?, ?, ?, ?)`,
      args: [ticketId, 'System', 'auto', auto.response],
    });
  }

  // Feed event only for escalated tickets
  if (status === 'escalated') {
    await insertFeedEvent('support_ticket', submitterName, subject, { ticket_id: ticketId, category, priority });
  }

  return NextResponse.json({
    ticket_id: ticketId,
    status,
    category,
    priority,
    auto_response: auto.response || null,
  }, { status: 201 });
}
