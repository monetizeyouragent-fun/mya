export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { insertFeedEvent } from '@/lib/feed';
import { creditAgentEarning } from '@/lib/agent-stats';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const tweetId = typeof body.tweet_id === 'string' ? body.tweet_id : '';
  if (!tweetId) {
    return NextResponse.json({ error: 'tweet_id required', code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  try {
    // Get the verified submission
    const result = await db.execute({
      sql: `SELECT * FROM tweet_submissions WHERE tweet_id = ? AND verification_status = 'verified'`,
      args: [tweetId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No verified submission found for this tweet', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const submission = result.rows[0];
    const walletAddress = String(submission.wallet_address);
    const rewardAmount = Number(submission.reward_amount);
    const authorUsername = String(submission.author_username || '');

    const privateKey = process.env.PAYMENT_PRIVATE_KEY;
    if (!privateKey) {
      // No private key — mark as verified but can't pay yet
      return NextResponse.json({
        success: false,
        message: 'Payment key not configured. Submission verified but payment queued.',
        tx_status: 'queued',
        payment_status: 'pending',
      });
    }

    // Dynamic import ethers to avoid issues at build time
    const { ethers } = await import('ethers');

    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_TRANSFER_ABI, wallet);

    // USDC has 6 decimals
    const amount = BigInt(Math.round(rewardAmount * 1e6));

    const tx = await usdc.transfer(walletAddress, amount);
    const receipt = await tx.wait();
    const txHash = receipt?.hash || tx.hash;

    // Update submission as paid
    await db.execute({
      sql: `UPDATE tweet_submissions SET verification_status = 'paid', tx_hash = ?, paid_at = datetime('now') WHERE tweet_id = ?`,
      args: [txHash, tweetId],
    });

    // Update payment config totals
    await db.execute({
      sql: `UPDATE payment_config SET total_spent = total_spent + ?, total_tweets_paid = total_tweets_paid + 1, updated_at = datetime('now') WHERE id = 1`,
      args: [rewardAmount],
    });

    // Check if budget exhausted — auto-close job
    const config = await db.execute('SELECT total_spent, total_budget FROM payment_config WHERE id = 1');
    if (config.rows.length > 0) {
      const spent = Number(config.rows[0].total_spent);
      const budget = Number(config.rows[0].total_budget);
      if (spent >= budget) {
        await db.execute('UPDATE payment_config SET job_active = 0, updated_at = datetime(\'now\') WHERE id = 1');
      }
    }

    // Credit agent stats (Issue 17)
    const agentName = authorUsername || walletAddress.slice(0, 10);
    await creditAgentEarning(agentName, rewardAmount);

    // Log feed event
    await insertFeedEvent(
      'tweet_paid',
      agentName,
      'Tweet to Earn',
      JSON.stringify({ reward: rewardAmount, tx_hash: txHash })
    );

    return NextResponse.json({
      success: true,
      tx_hash: txHash,
      amount: rewardAmount,
      tx_status: 'confirmed',
      payment_status: 'paid',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment processing error';
    // Don't leak internal details
    const safeMessage = message.includes('insufficient') ? 'Insufficient funds' :
                        message.includes('nonce') ? 'Transaction pending, please retry' :
                        'Payment processing failed';
    return NextResponse.json({ error: safeMessage, code: 'PAYMENT_ERROR', payment_status: 'failed' }, { status: 500 });
  }
}
