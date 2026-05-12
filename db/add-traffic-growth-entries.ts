import { getDb } from '../lib/db';
import { TRAFFIC_GROWTH_ENTRIES_2026_05_02 } from './traffic-growth-entries-2026-05-02';

async function ensureAgentNativeColumn() {
  const db = getDb();
  const tableInfo = await db.execute('PRAGMA table_info(entries)');
  const hasAgentNative = tableInfo.rows.some((row: any) => row.name === 'agent_native');
  if (!hasAgentNative) {
    await db.execute('ALTER TABLE entries ADD COLUMN agent_native INTEGER DEFAULT 0');
    console.log('Added entries.agent_native column');
  }
}

async function main() {
  const db = getDb();
  await ensureAgentNativeColumn();

  let inserted = 0;
  let skipped = 0;

  for (const entry of TRAFFIC_GROWTH_ENTRIES_2026_05_02) {
    const existing = await db.execute({
      sql: 'SELECT id FROM entries WHERE LOWER(name) = LOWER(?) OR (url = ? AND url IS NOT NULL) LIMIT 1',
      args: [entry.name, entry.url],
    });

    if (existing.rows.length > 0) {
      skipped += 1;
      console.log(`skip: ${entry.name} already exists as #${existing.rows[0].id}`);
      continue;
    }

    const result = await db.execute({
      sql: `INSERT INTO entries (
        name, category, subcategory, url, description, stage, model, traction,
        earn_potential, difficulty, time_to_first_dollar, votes_up, votes_down,
        status, agent_native
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      args: [
        entry.name,
        entry.category,
        entry.subcategory,
        entry.url,
        entry.description,
        entry.stage,
        entry.model,
        entry.traction,
        entry.earn_potential,
        entry.difficulty,
        entry.time_to_first_dollar,
        entry.votes_up,
        entry.votes_down,
        entry.agent_native,
      ],
    });

    inserted += 1;
    console.log(`inserted: #${result.lastInsertRowid} ${entry.name} (${entry.source_url})`);
  }

  console.log(`Traffic growth entries complete: ${inserted} inserted, ${skipped} skipped.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
