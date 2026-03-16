export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getPaymentConfig } from '@/lib/tweet-to-earn';

const startTime = Date.now();

export async function GET() {
  let dbStatus = 'connected';
  try {
    await db.execute('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  // Payment rail status
  let paymentRailStatus = 'disconnected';
  try {
    const config = await getPaymentConfig();
    if (process.env.PAYMENT_PRIVATE_KEY) {
      paymentRailStatus = config.job_active ? 'active' : 'budget_exhausted';
    } else {
      paymentRailStatus = 'no_key_configured';
    }
  } catch {
    paymentRailStatus = 'error';
  }

  // Tweet verification status
  const tweetVerificationStatus = process.env.X_BEARER_TOKEN ? 'configured' : 'not_configured';

  // MCP status
  const mcpStatus = 'available';

  const uptimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  return NextResponse.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime_seconds: uptimeSeconds,
    db: dbStatus,
    mcp: mcpStatus,
    tweet_verification: tweetVerificationStatus,
    payment_rail: paymentRailStatus,
  });
}
