import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-auth-secret');
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const priority = searchParams.get('priority');

  let sql = 'SELECT * FROM support_tickets';
  const conditions: string[] = [];
  const args: string[] = [];

  if (status) {
    conditions.push('status = ?');
    args.push(status);
  }
  if (category) {
    conditions.push('category = ?');
    args.push(category);
  }
  if (priority) {
    conditions.push('priority = ?');
    args.push(priority);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` ORDER BY
    CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 END ASC,
    CASE status WHEN 'escalated' THEN 0 WHEN 'open' THEN 1 WHEN 'auto_resolved' THEN 2 WHEN 'resolved' THEN 3 WHEN 'closed' THEN 4 END ASC,
    created_at DESC`;

  const result = await db.execute({ sql, args });
  return NextResponse.json(result.rows);
}
