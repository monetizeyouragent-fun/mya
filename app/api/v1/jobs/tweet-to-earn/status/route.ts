export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter } from '@/lib/rate-limit';
import { getPaymentConfig, getCurrentReward, getNextTierAt } from '@/lib/tweet-to-earn';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const config = await getPaymentConfig();

    const recentResult = await db.execute(
      `SELECT tweet_url, author_username, reward_amount, verification_status, tx_hash, created_at FROM tweet_submissions ORDER BY created_at DESC LIMIT 10`
    );

    return NextResponse.json({
      active: config.job_active === 1 && config.total_spent < config.total_budget,
      total_budget: config.total_budget,
      total_spent: config.total_spent,
      remaining: Math.max(0, config.total_budget - config.total_spent),
      total_tweets_paid: config.total_tweets_paid,
      current_reward: getCurrentReward(config.total_tweets_paid),
      next_tier_at: getNextTierAt(config.total_tweets_paid),
      recent_submissions: recentResult.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
