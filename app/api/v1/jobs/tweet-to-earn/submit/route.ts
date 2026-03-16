export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { insertFeedEvent } from '@/lib/feed';
import {
  isValidTweetUrl,
  extractTweetId,
  isValidWalletAddress,
  getPaymentConfig,
  getRewardForTweetNumber,
  verifyTweet,
} from '@/lib/tweet-to-earn';

// Stricter rate limit: 3 submissions per hour per IP
const submitLimiter = rateLimit({ limit: 3, windowMs: 60 * 60 * 1000, prefix: 'tweet-submit' });

export async function POST(request: NextRequest) {
  const limited = submitLimiter(request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const tweetUrl = typeof body.tweet_url === 'string' ? body.tweet_url.trim() : '';
  const walletAddress = typeof body.wallet_address === 'string' ? body.wallet_address.trim() : '';

  // Validate tweet URL format
  if (!tweetUrl || !isValidTweetUrl(tweetUrl)) {
    return NextResponse.json(
      { error: 'Invalid tweet_url. Must be https://x.com/... or https://twitter.com/.../status/...', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Validate wallet address
  if (!walletAddress || !isValidWalletAddress(walletAddress)) {
    return NextResponse.json(
      { error: 'Invalid wallet_address. Must be a valid Ethereum address (0x... 42 chars)', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const tweetId = extractTweetId(tweetUrl);
  if (!tweetId) {
    return NextResponse.json(
      { error: 'Could not extract tweet ID from URL', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  try {
    // Check for duplicate tweet
    const existing = await db.execute({
      sql: 'SELECT id FROM tweet_submissions WHERE tweet_id = ?',
      args: [tweetId],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'This tweet has already been submitted', code: 'DUPLICATE' },
        { status: 409 }
      );
    }

    // Check wallet cooldown: one payment per wallet per 24 hours
    const walletRecent = await db.execute({
      sql: `SELECT id FROM tweet_submissions WHERE wallet_address = ? AND created_at > datetime('now', '-24 hours') AND verification_status != 'rejected'`,
      args: [walletAddress],
    });
    if (walletRecent.rows.length > 0) {
      return NextResponse.json(
        { error: 'One submission per wallet per 24 hours. Try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // Check budget
    const config = await getPaymentConfig();
    if (!config.job_active || config.total_spent >= config.total_budget) {
      return NextResponse.json(
        { error: 'Job closed — budget exhausted', code: 'BUDGET_EXHAUSTED' },
        { status: 400 }
      );
    }

    // Calculate reward
    const nextTweetNumber = config.total_tweets_paid + 1;
    const rewardAmount = getRewardForTweetNumber(nextTweetNumber);

    // Check if this reward would exceed budget
    if (config.total_spent + rewardAmount > config.total_budget) {
      return NextResponse.json(
        { error: 'Job closed — budget exhausted', code: 'BUDGET_EXHAUSTED' },
        { status: 400 }
      );
    }

    // Verify tweet via X API
    const verification = await verifyTweet(tweetId);

    if (!verification.valid) {
      const isApiError = verification.error?.includes('API') || verification.error?.includes('configured') || verification.error?.includes('retry');

      if (isApiError) {
        // X API failure — save as pending for retry
        await db.execute({
          sql: `INSERT INTO tweet_submissions (job_id, tweet_url, tweet_id, wallet_address, reward_amount, verification_status, rejection_reason) VALUES (0, ?, ?, ?, ?, 'pending', ?)`,
          args: [tweetUrl, tweetId, walletAddress, rewardAmount, verification.error || null],
        });

        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Tweet saved for verification. Will be processed when X API is available.',
          reward: rewardAmount,
        });
      }

      // Legitimate rejection
      return NextResponse.json(
        { error: verification.error || 'Tweet verification failed', code: 'VERIFICATION_FAILED' },
        { status: 400 }
      );
    }

    // Tweet verified — save and process payment
    await db.execute({
      sql: `INSERT INTO tweet_submissions (job_id, tweet_url, tweet_id, author_username, author_id, wallet_address, reward_amount, verification_status, verified_at) VALUES (0, ?, ?, ?, ?, ?, ?, 'verified', datetime('now'))`,
      args: [
        tweetUrl,
        tweetId,
        verification.author_username || null,
        verification.author_id || null,
        walletAddress,
        rewardAmount,
      ],
    });

    // Log feed event
    await insertFeedEvent(
      'tweet_verified',
      verification.author_username || walletAddress.slice(0, 10),
      'Tweet to Earn',
      JSON.stringify({ reward: rewardAmount, tweet_id: tweetId })
    );

    // Trigger payment asynchronously
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/v1/jobs/tweet-to-earn/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweet_id: tweetId }),
    }).catch(() => {
      // Payment will be retried — non-blocking
    });

    return NextResponse.json({
      success: true,
      reward: rewardAmount,
      tx_status: 'pending',
      tweet_verified: true,
      author: verification.author_username || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Check for unique constraint violation
    if (message.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'This tweet has already been submitted', code: 'DUPLICATE' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
