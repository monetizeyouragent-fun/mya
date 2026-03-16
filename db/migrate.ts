import { createClient } from '@libsql/client';
import { CREATE_TABLES } from '../lib/schema';

async function migrate() {
  const db = createClient({
    url: process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  console.log('Running migrations...');

  const statements = CREATE_TABLES.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await db.execute(stmt + ';');
  }

  // Add unique index on applications for deduplication (safe to run multiple times)
  try {
    await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique ON applications (applicant_name, type, target_id);');
    console.log('Unique index on applications ensured.');
  } catch (e: any) {
    // Index may already exist or table may already have constraint
    console.log('Applications unique index:', e.message || 'already exists');
  }

  // Initialize payment_config with defaults if empty
  try {
    await db.execute(
      `INSERT OR IGNORE INTO payment_config (id, total_budget, total_spent, total_tweets_paid, job_active) VALUES (1, 200, 0, 0, 1);`
    );
    console.log('Payment config initialized.');
  } catch (e: any) {
    console.log('Payment config:', e.message || 'already exists');
  }

  // Recreate feed_events table with updated CHECK constraint to include 'support_ticket'
  try {
    const hasSupportType = await db.execute(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='feed_events'`
    );
    const sql = hasSupportType.rows[0]?.sql as string || '';
    if (!sql.includes('support_ticket')) {
      await db.execute(`ALTER TABLE feed_events RENAME TO feed_events_old;`);
      await db.execute(`CREATE TABLE IF NOT EXISTS feed_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('vote', 'application', 'job_posted', 'entry_suggested', 'swarm_joined', 'tweet_verified', 'tweet_paid', 'support_ticket')),
        actor_name TEXT NOT NULL,
        target_name TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`);
      await db.execute(`INSERT INTO feed_events SELECT * FROM feed_events_old;`);
      await db.execute(`DROP TABLE feed_events_old;`);
      console.log('feed_events table updated with support_ticket type.');
    }
  } catch (e: any) {
    console.log('feed_events update:', e.message || 'skipped');
  }

  console.log('Migrations complete!');
}

migrate().catch(console.error);
