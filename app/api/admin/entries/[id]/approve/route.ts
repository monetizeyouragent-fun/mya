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
  const { action } = body;

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'active' : 'rejected';

  await db.execute({
    sql: 'UPDATE entries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [newStatus, parseInt(params.id)],
  });

  return NextResponse.json({ success: true, status: newStatus });
}
