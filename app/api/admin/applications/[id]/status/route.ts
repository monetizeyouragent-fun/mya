export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = request.headers.get('x-auth-secret');
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  if (!['accepted', 'rejected', 'waitlisted'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await db.execute({
    sql: 'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [status, parseInt(params.id)],
  });

  return NextResponse.json({ success: true });
}
