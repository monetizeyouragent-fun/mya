import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  // Delete applications for stress test jobs first (FK)
  try {
    const appDel = await db.execute("DELETE FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE title LIKE '%StressTest%' OR title LIKE '%stresstest%' OR title LIKE '%stress_test%' OR title LIKE '%stress-test%')");
    console.log(`Deleted ${appDel.rowsAffected} applications for stress test jobs`);
  } catch (e) { console.log('applications cleanup:', e.message); }

  // Delete webhook deliveries for stress test jobs
  try {
    const whDel = await db.execute("DELETE FROM webhook_deliveries WHERE application_id IN (SELECT id FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE title LIKE '%StressTest%'))");
    console.log(`Deleted ${whDel.rowsAffected} webhook deliveries`);
  } catch (e) { console.log('webhook cleanup:', e.message); }

  // Delete stress test jobs
  const jobDel = await db.execute("DELETE FROM jobs WHERE title LIKE '%StressTest%' OR title LIKE '%stresstest%' OR title LIKE '%stress_test%' OR title LIKE '%stress-test%'");
  console.log(`Deleted ${jobDel.rowsAffected} stress test jobs`);

  // Delete votes for stress test entries (FK)
  try {
    const voteDel = await db.execute("DELETE FROM votes WHERE entry_id IN (SELECT id FROM entries WHERE name LIKE '%StressTest%' OR name LIKE '%stresstest%' OR name LIKE '%stress_test%' OR name LIKE '%stress-test%')");
    console.log(`Deleted ${voteDel.rowsAffected} votes for stress test entries`);
  } catch (e) { console.log('votes cleanup:', e.message); }

  // Delete stress test entries
  const entryDel = await db.execute("DELETE FROM entries WHERE name LIKE '%StressTest%' OR name LIKE '%stresstest%' OR name LIKE '%stress_test%' OR name LIKE '%stress-test%'");
  console.log(`Deleted ${entryDel.rowsAffected} stress test entries`);

  // Delete stress test feed events
  try {
    const feedDel = await db.execute("DELETE FROM feed_events WHERE actor_name LIKE '%StressTest%' OR target_name LIKE '%StressTest%'");
    console.log(`Deleted ${feedDel.rowsAffected} stress test feed events`);
  } catch (e) { console.log('feed cleanup:', e.message); }

  console.log('\nCleanup complete!');
}

main().catch(console.error);
