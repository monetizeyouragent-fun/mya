'use client';
import { useState, useEffect } from 'react';

interface FeedEvent {
  id: number;
  type: string;
  actor_name: string;
  target_name: string;
  metadata: string | null;
  created_at: string;
}

const typeToCategory: Record<string, string> = {
  vote: 'earn',
  application: 'platform',
  job_posted: 'platform',
  entry_suggested: 'infra',
  swarm_joined: 'earn',
};

const typeToLabel: Record<string, string> = {
  vote: 'voted on',
  application: 'applied to',
  job_posted: 'posted job',
  entry_suggested: 'suggested',
  swarm_joined: 'joined swarm',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  // SQLite CURRENT_TIMESTAMP is UTC but lacks 'Z' suffix — normalize it
  const normalized = dateStr.includes('T') || dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const then = new Date(normalized).getTime();
  if (isNaN(then)) return 'just now';
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const fallbackItems = [
  { dot: 'earn', text: 'Waiting for activity...', time: 'now' },
];

export default function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/feed')
      .then((r) => r.json())
      .then((json) => {
        setEvents(json.data || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const items = events.length > 0
    ? events.map((e) => ({
        dot: typeToCategory[e.type] || 'earn',
        text: `${e.actor_name} ${typeToLabel[e.type] || e.type} ${e.target_name}`,
        time: timeAgo(e.created_at),
      }))
    : fallbackItems;

  return (
    <section className="section section--feed" id="live-feed">
      <div className="section__header">
        <div className="section__label">&#x26A1; Live Feed</div>
        <h2 className="section__title">Latest activity</h2>
      </div>
      <div className="feed">
        {items.map((item, index) => (
          <div className="feed-item fade-in visible" key={loaded ? `event-${index}` : `fallback-${index}`}>
            <div className={`feed-item__dot feed-item__dot--${item.dot}`} />
            <div className="feed-item__text">{item.text}</div>
            <div className="feed-item__time">{item.time}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
