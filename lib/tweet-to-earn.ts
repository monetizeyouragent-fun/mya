import db from '@/lib/db';

/** Pricing tiers: tweets 1-10 = $5, 11-20 = $4, 21-30 = $3, 31-40 = $2, 41+ = $1 */
export function getRewardForTweetNumber(tweetNumber: number): number {
  if (tweetNumber <= 10) return 5;
  if (tweetNumber <= 20) return 4;
  if (tweetNumber <= 30) return 3;
  if (tweetNumber <= 40) return 2;
  return 1;
}

/** Get current reward amount based on how many tweets have been paid */
export function getCurrentReward(totalTweetsPaid: number): number {
  return getRewardForTweetNumber(totalTweetsPaid + 1);
}

/** How many tweets until the reward drops to the next tier */
export function getNextTierAt(totalTweetsPaid: number): number {
  const current = totalTweetsPaid + 1;
  if (current <= 10) return 10 - totalTweetsPaid;
  if (current <= 20) return 20 - totalTweetsPaid;
  if (current <= 30) return 30 - totalTweetsPaid;
  if (current <= 40) return 40 - totalTweetsPaid;
  return 0; // already at lowest tier
}

/** Extract tweet ID from a tweet URL */
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

/** Validate tweet URL format */
export function isValidTweetUrl(url: string): boolean {
  return /^https:\/\/(x\.com|twitter\.com)\/\w+\/status\/\d+/.test(url);
}

/** Validate Ethereum wallet address */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** Get or initialize payment config */
export async function getPaymentConfig() {
  const result = await db.execute('SELECT * FROM payment_config WHERE id = 1');
  if (result.rows.length === 0) {
    await db.execute(
      'INSERT INTO payment_config (id, total_budget, total_spent, total_tweets_paid, job_active) VALUES (1, 200, 0, 0, 1)'
    );
    return { total_budget: 200, total_spent: 0, total_tweets_paid: 0, job_active: 1 };
  }
  const row = result.rows[0];
  return {
    total_budget: Number(row.total_budget),
    total_spent: Number(row.total_spent),
    total_tweets_paid: Number(row.total_tweets_paid),
    job_active: Number(row.job_active),
  };
}

/** Verify tweet via X API */
export async function verifyTweet(tweetId: string): Promise<{
  valid: boolean;
  error?: string;
  author_username?: string;
  author_id?: string;
  text?: string;
}> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    // If no token configured, save as pending for later retry
    return { valid: false, error: 'X_BEARER_TOKEN not configured' };
  }

  try {
    const res = await fetch(
      `https://api.x.com/2/tweets/${tweetId}?tweet.fields=text,author_id,created_at,entities&expansions=author_id`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return { valid: false, error: 'Tweet not found or deleted' };
      }
      // API error — don't reject, save as pending
      return { valid: false, error: `X API error: ${res.status}` };
    }

    const data = await res.json();

    if (!data.data) {
      return { valid: false, error: 'Tweet not found' };
    }

    const tweetText: string = data.data.text || '';
    const authorId: string = data.data.author_id || '';
    const createdAt: string = data.data.created_at || '';

    // Check tweet contains the required link (check text + expanded URLs from entities)
    const expandedUrls: string[] = (data.data.entities?.urls || []).map((u: any) => (u.expanded_url || u.unwound_url || '').toLowerCase());
    const hasLink = tweetText.toLowerCase().includes('monetizeyouragent.fun') || expandedUrls.some((u: string) => u.includes('monetizeyouragent.fun'));
    if (!hasLink) {
      return { valid: false, error: 'Tweet does not contain monetizeyouragent.fun' };
    }

    // Check tweet is recent (within 7 days)
    if (createdAt) {
      const tweetDate = new Date(createdAt);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (tweetDate < sevenDaysAgo) {
        return { valid: false, error: 'Tweet is older than 7 days' };
      }
    }

    // Extract author username from expansions
    let authorUsername = '';
    if (data.includes?.users?.length > 0) {
      authorUsername = data.includes.users[0].username || '';
    }

    return {
      valid: true,
      author_username: authorUsername,
      author_id: authorId,
      text: tweetText,
    };
  } catch {
    // Network error — save as pending for retry
    return { valid: false, error: 'X API request failed — will retry' };
  }
}
