export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-auth-secret');
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let sql = 'SELECT * FROM applications';
  const conditions: string[] = [];
  const args: string[] = [];

  if (status) {
    conditions.push('status = ?');
    args.push(status);
  }
  if (type) {
    conditions.push('type = ?');
    args.push(type);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY created_at DESC';

  const result = await db.execute({ sql, args });
  return NextResponse.json(result.rows);
}
