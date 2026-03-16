import db from '@/lib/db';

export type FeedEventType = 'vote' | 'application' | 'job_posted' | 'entry_suggested' | 'swarm_joined' | 'tweet_verified' | 'tweet_paid' | 'support_ticket';

export async function insertFeedEvent(
  type: FeedEventType,
  actorName: string,
  targetName: string,
  metadata?: Record<string, unknown> | string
) {
  try {
    await db.execute({
      sql: `INSERT INTO feed_events (type, actor_name, target_name, metadata) VALUES (?, ?, ?, ?)`,
      args: [type, actorName, targetName, metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null],
    });
  } catch {
    // Feed events are non-critical — don't break the main request
  }
}
