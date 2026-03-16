import { createClient } from '@libsql/client';

async function cleanup() {
  const db = createClient({
    url: process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  console.log('Running test data cleanup...');

  // 1. Delete votes on test entries (FK: votes → entries)
  const votesResult = await db.execute(
    `DELETE FROM votes WHERE entry_id IN (
      SELECT id FROM entries WHERE name LIKE '%Test%' OR name LIKE '%Audit%' OR name LIKE '%FrontendTest%' OR name LIKE '%Duplicate%' OR name LIKE '%Legacy%' OR name LIKE '%Probe%' OR name LIKE '%SmokeTest%' OR name LIKE '%alert%'
    )`
  );
  console.log(`Deleted ${votesResult.rowsAffected} test votes`);

  // 2. Delete feed events
  const feedResult = await db.execute(
    `DELETE FROM feed_events WHERE actor_name LIKE '%Audit%' OR actor_name LIKE '%Test%' OR actor_name LIKE '%Smoke%' OR actor_name LIKE '%FinalAudit%' OR target_name LIKE '%Test%' OR target_name LIKE '%Audit%'`
  );
  console.log(`Deleted ${feedResult.rowsAffected} test feed events`);

  // 3. Delete webhook deliveries for test applications FIRST (FK: webhook_deliveries → applications)
  try {
    await db.execute(
      `DELETE FROM webhook_deliveries WHERE application_id IN (
        SELECT id FROM applications WHERE applicant_name LIKE '%Audit%' OR applicant_name LIKE '%Test%' OR applicant_name LIKE '%FrontendTest%' OR applicant_name LIKE '%Smoke%' OR applicant_name LIKE '%FinalAudit%' OR applicant_name LIKE '%Webhook%'
      )`
    );
    console.log('Cleaned test webhook deliveries');
  } catch { console.log('No webhook_deliveries to clean'); }

  // 4. Delete test applications (safe now — webhook deliveries removed)
  const appsResult = await db.execute(
    `DELETE FROM applications WHERE applicant_name LIKE '%Audit%' OR applicant_name LIKE '%Test%' OR applicant_name LIKE '%FrontendTest%' OR applicant_name LIKE '%Smoke%' OR applicant_name LIKE '%FinalAudit%' OR applicant_name LIKE '%Webhook%'`
  );
  console.log(`Deleted ${appsResult.rowsAffected} test applications`);

  // 5. Delete test jobs (safe now — applications removed)
  const jobsResult = await db.execute(
    `DELETE FROM jobs WHERE title LIKE '%Test%' OR title LIKE '%Audit%' OR title LIKE '%FrontendTest%' OR title LIKE '%Probe%'`
  );
  console.log(`Deleted ${jobsResult.rowsAffected} test jobs`);

  // 6. Delete test swarms
  const swarmsResult = await db.execute(
    `DELETE FROM swarms WHERE name LIKE '%Test%' OR name LIKE '%FrontendTest%'`
  );
  console.log(`Deleted ${swarmsResult.rowsAffected} test swarms`);

  // 7. Delete test entries (safe now — votes removed)
  const entriesResult = await db.execute(
    `DELETE FROM entries WHERE name LIKE '%Test%' OR name LIKE '%Audit%' OR name LIKE '%FrontendTest%' OR name LIKE '%Duplicate%' OR name LIKE '%Legacy%' OR name LIKE '%Probe%' OR name LIKE '%SmokeTest%' OR name LIKE '%alert%'`
  );
  console.log(`Deleted ${entriesResult.rowsAffected} test entries`);

  console.log('Cleanup complete!');
}

cleanup().catch(console.error);
