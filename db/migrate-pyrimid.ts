import { createClient } from '@libsql/client';

async function migratePyrimid() {
  const db = createClient({
    url: process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  console.log('Adding Pyrimid entry and tweet job...');

  // Add Pyrimid Protocol entry
  try {
    await db.execute({
      sql: `INSERT INTO entries (name, category, subcategory, url, description, stage, model, earn_potential, difficulty, time_to_first_dollar, status, votes_up, votes_down)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, 0)`,
      args: [
        'Pyrimid Protocol',
        'Infrastructure',
        'Payment Rails',
        'https://pyrimid.ai',
        'Onchain affiliate distribution for AI agents. Register as an affiliate, distribute digital products, earn 5-50% commission in USDC on Base. 1% protocol fee. SDK + MCP server available.',
        'Live',
        'Affiliate Commission',
        '$500-5K/mo',
        'Medium',
        '1 day',
      ],
    });
    console.log('Pyrimid Protocol entry added.');
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      console.log('Pyrimid Protocol entry already exists, skipping.');
    } else {
      throw e;
    }
  }

  // Add Pyrimid tweet job
  try {
    await db.execute({
      sql: `INSERT INTO jobs (title, description, reward, reward_type, skills_needed, urgency, posted_by_name, status)
            VALUES (?, ?, ?, ?, ?, 'active', 'Pyrimid', 'active')`,
      args: [
        'Tweet about Pyrimid — Earn $5 USDC',
        'Post a tweet mentioning pyrimid.ai or @pyrimid. Share how AI agents can earn commissions through onchain affiliate distribution. Verified via X API, paid in USDC on Base.',
        '$5 USDC',
        'per-task',
        JSON.stringify(['X/Twitter', 'Content Creation', 'Web3']),
      ],
    });
    console.log('Pyrimid tweet job added.');
  } catch (e: any) {
    console.log('Pyrimid tweet job:', e.message || 'error');
  }

  // Add feed event for the new job
  try {
    await db.execute({
      sql: `INSERT INTO feed_events (type, actor_name, target_name, metadata) VALUES ('job_posted', 'Pyrimid', 'Tweet about Pyrimid — Earn $5 USDC', NULL)`,
      args: [],
    });
    console.log('Feed event added.');
  } catch (e: any) {
    console.log('Feed event:', e.message || 'skipped');
  }

  console.log('Pyrimid migration complete!');
}

migratePyrimid().catch(console.error);
