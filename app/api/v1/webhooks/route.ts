export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  console.log('[webhook] Received:', JSON.stringify(body));

  return NextResponse.json({ received: true });
}
