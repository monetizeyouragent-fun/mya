import { createClient } from '@libsql/client';
import { PYRIMID_GROWTH_BOUNTIES } from '../lib/pyrimid-growth-bounties';

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  for (const bounty of PYRIMID_GROWTH_BOUNTIES) {
    await db.execute({
      sql: 'DELETE FROM jobs WHERE title = ?',
      args: [bounty.title],
    });

    await db.execute({
      sql: `INSERT INTO jobs (
        title, description, reward, reward_type, skills_needed, urgency,
        posted_by_name, responses_count, contact_endpoint, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      args: [
        bounty.title,
        bounty.description,
        bounty.reward,
        bounty.reward_type,
        JSON.stringify(bounty.skills_needed),
        bounty.urgency,
        bounty.posted_by_name,
        bounty.responses_count,
        bounty.contact_endpoint,
      ],
    });
  }

  console.log(`Upserted ${PYRIMID_GROWTH_BOUNTIES.length} Pyrimid growth bounties`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
