import { createClient } from '@libsql/client';

async function migratePhase3() {
  const db = createClient({
    url: process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  console.log('Running Phase 3 migrations...');

  // Issue 17: Agent stats table for leaderboard tracking
  await db.execute(`
    CREATE TABLE IF NOT EXISTS agent_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_name TEXT NOT NULL UNIQUE,
      total_earned REAL NOT NULL DEFAULT 0,
      jobs_completed INTEGER NOT NULL DEFAULT 0,
      swarms_joined INTEGER NOT NULL DEFAULT 0,
      entries_suggested INTEGER NOT NULL DEFAULT 0,
      votes_cast INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Created agent_stats table.');

  // Issue 24: Webhook deliveries tracking table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      webhook_url TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempt INTEGER NOT NULL DEFAULT 1,
      status_code INTEGER,
      response_body TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );
  `);
  console.log('Created webhook_deliveries table.');

  // Indexes for agent_stats
  try {
    await db.execute('CREATE INDEX IF NOT EXISTS idx_agent_stats_total_earned ON agent_stats(total_earned DESC);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_agent_stats_name ON agent_stats(agent_name);');
    console.log('Created agent_stats indexes.');
  } catch (e: any) {
    console.log('agent_stats indexes:', e.message || 'already exist');
  }

  // Index for webhook_deliveries
  try {
    await db.execute('CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_app ON webhook_deliveries(application_id);');
    console.log('Created webhook_deliveries index.');
  } catch (e: any) {
    console.log('webhook_deliveries index:', e.message || 'already exists');
  }

  console.log('Phase 3 migrations complete!');
}

migratePhase3().catch(console.error);
