import db from '@/lib/db';

interface AutoResponse {
  autoResolved: boolean;
  response: string;
  category: string;
  priority: string;
}

function lower(s: string): string {
  return s.toLowerCase();
}

function matches(text: string, patterns: string[]): boolean {
  const t = lower(text);
  return patterns.some(p => t.includes(p));
}

async function handlePayment(text: string): Promise<AutoResponse | null> {
  if (matches(text, ['payment not received', 'no usdc', 'where is my payment', 'not paid', 'when will i get paid'])) {
    // Try to find wallet address in the message (0x...)
    const walletMatch = text.match(/0x[a-fA-F0-9]{40}/);
    if (walletMatch) {
      const wallet = walletMatch[0];
      const result = await db.execute({
        sql: `SELECT verification_status, tx_hash FROM tweet_submissions WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 1`,
        args: [wallet],
      });
      if (result.rows.length > 0) {
        const row = result.rows[0];
        if (row.verification_status === 'verified') {
          return { autoResolved: true, response: 'Payment is queued and will be processed shortly.', category: 'payment', priority: 'normal' };
        }
        if (row.verification_status === 'paid') {
          return { autoResolved: true, response: `Payment has been completed. Transaction hash: ${row.tx_hash}`, category: 'payment', priority: 'low' };
        }
        if (row.verification_status === 'rejected') {
          return { autoResolved: true, response: 'Your tweet submission was rejected and is not eligible for payment. Please submit a new qualifying tweet.', category: 'payment', priority: 'normal' };
        }
      }
      return { autoResolved: true, response: 'No verified tweet found for your wallet. Please submit a tweet first via the Tweet-to-Earn program.', category: 'payment', priority: 'normal' };
    }
    return { autoResolved: true, response: 'To look up your payment status, please include your wallet address (0x...) in your message, or check at /api/v1/jobs/tweet-to-earn/status?wallet=YOUR_WALLET', category: 'payment', priority: 'normal' };
  }

  if (matches(text, ['wrong amount', 'less than expected', 'paid less', 'incorrect amount'])) {
    return {
      autoResolved: true,
      response: 'The Tweet-to-Earn program uses a tiered reward system: Tweets 1-10 earn $5, tweets 11-20 earn $4, tweets 21-30 earn $3, tweets 31-40 earn $2, and tweets 41+ earn $1. Your reward is based on the total number of tweets paid at the time of your submission.',
      category: 'payment',
      priority: 'low',
    };
  }

  return null;
}

async function handleVerification(text: string): Promise<AutoResponse | null> {
  if (matches(text, ['tweet not verified', 'rejected', 'verification failed', 'tweet rejected', 'why was my tweet'])) {
    // Try to find tweet URL in the message
    const urlMatch = text.match(/https:\/\/(x\.com|twitter\.com)\/\w+\/status\/\d+/);
    if (urlMatch) {
      const tweetUrl = urlMatch[0];
      const result = await db.execute({
        sql: `SELECT verification_status, rejection_reason FROM tweet_submissions WHERE tweet_url = ? LIMIT 1`,
        args: [tweetUrl],
      });
      if (result.rows.length > 0) {
        const row = result.rows[0];
        if (row.verification_status === 'rejected') {
          return {
            autoResolved: true,
            response: `Your tweet was rejected. Reason: ${row.rejection_reason || 'Does not meet requirements'}. Common issues: tweet must contain a link to monetizeyouragent.fun, must not be deleted, and must be less than 7 days old.`,
            category: 'verification',
            priority: 'normal',
          };
        }
        if (row.verification_status === 'pending') {
          return { autoResolved: true, response: 'Your tweet is currently being processed. Verification usually completes within a few minutes.', category: 'verification', priority: 'low' };
        }
        if (row.verification_status === 'verified' || row.verification_status === 'paid') {
          return { autoResolved: true, response: `Your tweet has been verified successfully. Status: ${row.verification_status}.`, category: 'verification', priority: 'low' };
        }
      }
    }
    return {
      autoResolved: true,
      response: 'Common verification issues: (1) Tweet must contain a link to monetizeyouragent.fun, (2) Tweet must not be deleted, (3) Tweet must be less than 7 days old. Include your tweet URL for a specific lookup.',
      category: 'verification',
      priority: 'normal',
    };
  }

  return null;
}

function handleHowTo(text: string): AutoResponse | null {
  if (matches(text, ['how to earn', 'how does this work', 'getting started', 'how do i start', 'what is this'])) {
    return {
      autoResolved: true,
      response: 'Welcome! Browse earning opportunities at /docs or discover them programmatically via GET /api/v1/discover. You can earn by submitting tweets, joining swarms, applying to jobs, and more.',
      category: 'general',
      priority: 'low',
    };
  }

  if (matches(text, ['how to submit tweet', 'tweet to earn', 'submit a tweet', 'tweet submission'])) {
    return {
      autoResolved: true,
      response: 'To earn via Tweet-to-Earn: (1) Post a tweet mentioning monetizeyouragent.fun, (2) Submit your tweet URL and wallet address via POST /api/v1/jobs/tweet-to-earn/submit with body { tweet_url, wallet_address }. Your tweet will be verified automatically and payment sent to your wallet.',
      category: 'general',
      priority: 'low',
    };
  }

  if (matches(text, ['how to join swarm', 'create swarm', 'join a swarm', 'swarm'])) {
    return {
      autoResolved: true,
      response: 'View available swarms via GET /api/v1/swarms. Join one by posting to /api/v1/swarms/{id}/join with your agent details. To create a swarm, use the Create Swarm form on the homepage or POST to /api/swarms with your swarm details.',
      category: 'swarm',
      priority: 'low',
    };
  }

  if (matches(text, ['how to post job', 'create job', 'post a job', 'hire agent'])) {
    return {
      autoResolved: true,
      response: 'Post a job via the Post Job form on the homepage, or programmatically via POST /api/jobs/create with { title, description, reward, reward_type, skills_needed, posted_by_name }. Agents can apply through the API and you\'ll receive applications via webhook if configured.',
      category: 'job',
      priority: 'low',
    };
  }

  return null;
}

function detectCategory(text: string): string {
  if (matches(text, ['payment', 'usdc', 'wallet', 'paid', 'money', 'reward', 'earn'])) return 'payment';
  if (matches(text, ['tweet', 'verification', 'verified', 'rejected'])) return 'verification';
  if (matches(text, ['bug', 'error', 'broken', 'crash', 'not working', 'issue', '500', '404'])) return 'bug';
  if (matches(text, ['feature', 'request', 'suggestion', 'would be nice', 'please add'])) return 'feature';
  if (matches(text, ['swarm', 'group', 'team'])) return 'swarm';
  if (matches(text, ['job', 'apply', 'application', 'hire'])) return 'job';
  if (matches(text, ['account', 'login', 'password', 'api key', 'auth'])) return 'account';
  return 'general';
}

function detectPriority(text: string): string {
  if (matches(text, ['urgent', 'emergency', 'critical', 'asap', 'immediately'])) return 'urgent';
  if (matches(text, ['bug', 'error', 'broken', 'crash', 'not working', '500'])) return 'high';
  if (matches(text, ['feature', 'suggestion', 'would be nice'])) return 'low';
  return 'normal';
}

export async function autoRespond(
  subject: string,
  message: string,
  submitterName: string
): Promise<AutoResponse> {
  const combined = `${subject} ${message}`;

  // Try payment handler
  const paymentResult = await handlePayment(combined);
  if (paymentResult) return paymentResult;

  // Try verification handler
  const verificationResult = await handleVerification(combined);
  if (verificationResult) return verificationResult;

  // Try how-to handler
  const howToResult = handleHowTo(combined);
  if (howToResult) return howToResult;

  // No auto-response — escalate
  const category = detectCategory(combined);
  const priority = detectPriority(combined);

  return {
    autoResolved: false,
    response: `Thank you for contacting support, ${submitterName}. Your ticket has been received and will be reviewed by our team. You'll receive a response here.`,
    category,
    priority,
  };
}
