export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  let dbStatus = 'connected';
  try {
    await db.execute('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
}
