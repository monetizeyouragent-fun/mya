export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getLimiter, withRateLimitHeaders, getGetRateLimitInfo } from '@/lib/rate-limit';
import { getPaymentConfig, getCurrentReward } from '@/lib/tweet-to-earn';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const config = await getPaymentConfig();
    const currentReward = getCurrentReward(config.total_tweets_paid);
    const budgetRemaining = Math.max(0, config.total_budget - config.total_spent);
    const active = config.job_active === 1 && budgetRemaining > 0;

    return withRateLimitHeaders(NextResponse.json({
      id: 'tweet-to-earn',
      title: 'Tweet about monetizeyouragent.fun — Get Paid USDC',
      description:
        'Post a tweet about monetizeyouragent.fun with a link to the site. Get paid USDC on Base automatically after verification. Reward starts at $5/tweet and decreases as more people participate.',
      reward: '$1-5 per verified tweet',
      reward_type: 'per-task',
      skills_needed: ['X/Twitter account', 'Base wallet'],
      how_to: 'POST /api/v1/jobs/tweet-to-earn/submit with { tweet_url, wallet_address }',
      current_reward: currentReward,
      budget_remaining: budgetRemaining,
      active,
      status: active ? 'active' : 'closed',
      _links: {
        submit: '/api/v1/jobs/tweet-to-earn/submit',
        status: '/api/v1/jobs/tweet-to-earn/status',
      },
    }), getGetRateLimitInfo(request));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
