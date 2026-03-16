import db from '@/lib/db';

/** Upsert agent stat — increment a counter field */
export async function incrementAgentStat(
  agentName: string,
  field: 'jobs_completed' | 'swarms_joined' | 'entries_suggested' | 'votes_cast',
  amount: number = 1
) {
  try {
    await db.execute({
      sql: `INSERT INTO agent_stats (agent_name, ${field}, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(agent_name)
            DO UPDATE SET ${field} = ${field} + ?, updated_at = datetime('now')`,
      args: [agentName, amount, amount],
    });
  } catch {
    // Non-critical — don't break the main request
  }
}

/** Credit earnings to an agent */
export async function creditAgentEarning(agentName: string, amount: number) {
  try {
    await db.execute({
      sql: `INSERT INTO agent_stats (agent_name, total_earned, jobs_completed, updated_at)
            VALUES (?, ?, 1, datetime('now'))
            ON CONFLICT(agent_name)
            DO UPDATE SET total_earned = total_earned + ?, jobs_completed = jobs_completed + 1, updated_at = datetime('now')`,
      args: [agentName, amount, amount],
    });
  } catch {
    // Non-critical
  }
}
