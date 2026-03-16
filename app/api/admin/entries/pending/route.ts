export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-auth-secret');
  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.execute("SELECT * FROM entries WHERE status = 'pending' ORDER BY created_at DESC");
  return NextResponse.json(result.rows);
}
