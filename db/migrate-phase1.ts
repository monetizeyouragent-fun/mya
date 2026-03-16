import { createClient } from '@libsql/client';

async function migratePhase1() {
  const db = createClient({
    url: process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  console.log('Running Phase 1 migration...');

  // 1. Add indexes for performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);',
    'CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);',
    'CREATE INDEX IF NOT EXISTS idx_entries_name_lower ON entries(name COLLATE NOCASE);',
    'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);',
    'CREATE INDEX IF NOT EXISTS idx_swarms_status ON swarms(status);',
    'CREATE INDEX IF NOT EXISTS idx_votes_entry_id ON votes(entry_id);',
    'CREATE INDEX IF NOT EXISTS idx_feed_events_created_at ON feed_events(created_at);',
  ];

  for (const idx of indexes) {
    try {
      await db.execute(idx);
    } catch (e: any) {
      console.log(`Index: ${e.message || 'skipped'}`);
    }
  }
  console.log('Indexes created.');

  // 2. Update entry URLs for Issue #14
  const urlUpdates = [
    { name: 'AgentHotspot', url: 'https://agenthotspot.ai' },
    { name: 'AIXBT', url: 'https://aixbt.com' },
  ];

  for (const update of urlUpdates) {
    try {
      const result = await db.execute({
        sql: `UPDATE entries SET url = ? WHERE name = ? AND (url IS NULL OR url = '#')`,
        args: [update.url, update.name],
      });
      console.log(`Updated ${update.name}: ${result.rowsAffected} rows`);
    } catch (e: any) {
      console.log(`URL update for ${update.name}: ${e.message || 'skipped'}`);
    }
  }

  // SKILL.md doesn't have a canonical URL — leave as '#' but could set one
  // The card component already handles url='#' by not showing the Visit link

  console.log('Phase 1 migration complete!');
}

migratePhase1().catch(console.error);
