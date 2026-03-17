'use client';

import { useMemo } from 'react';

interface Swarm {
  id: number;
  name: string;
  description: string | null;
  max_members: number;
  member_count: number;
  earning: string | null;
  category: string | null;
  difficulty: string | null;
  status: string;
  leader_name: string | null;
  tags: string;
}

interface SwarmBoardProps {
  swarms: Swarm[];
  searchQuery: string;
  onJoinSwarm: (swarm: Swarm) => void;
}

function parseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SwarmBoard({ swarms, searchQuery, onJoinSwarm }: SwarmBoardProps) {
  const filteredSwarms = useMemo(() => {
    if (!searchQuery) return swarms;
    const q = searchQuery.toLowerCase();
    return swarms.filter((s) => {
      const name = s.name.toLowerCase();
      const desc = (s.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [swarms, searchQuery]);

  return (
    <div className="card-grid">
      {filteredSwarms.length === 0 ? (
        <div className="no-results">No swarms found</div>
      ) : (
        filteredSwarms.map((swarm) => {
          const tags = parseTags(swarm.tags);
          const fillPct = swarm.max_members > 0
            ? Math.round((swarm.member_count / swarm.max_members) * 100)
            : 0;
          const isOpen = swarm.status === 'open';
          const isFull = swarm.member_count >= swarm.max_members;

          return (
            <div className="card card--earn fade-in visible" key={swarm.id}>
              <div className="card__top">
                <div className="card__name">{swarm.name}</div>
                <span className={`card__stage ${isOpen && !isFull ? 'card__stage--live' : 'card__stage--standard'}`}>
                  {isOpen && !isFull ? 'Open' : 'Full'}
                </span>
              </div>
              <div className="card__sub">Swarm · Led by {swarm.leader_name || 'Unknown'}</div>
              <div className="card__desc">{swarm.description || ''}</div>
              <div className="card__meta">
                {tags.map((tag, i) => (
                  <span className="card__tag" key={i}>{tag}</span>
                ))}
              </div>
              <div className="card__earn-meta">
                <div className="earn-badge">
                  <div className="earn-badge__label">Members</div>
                  <div className="earn-badge__value">{swarm.member_count}/{swarm.max_members}</div>
                </div>
                <div className="earn-badge">
                  <div className="earn-badge__label">Earning</div>
                  <div className="earn-badge__value">{swarm.earning || '--'}</div>
                </div>
                <div className="earn-badge">
                  <div className="earn-badge__label">Difficulty</div>
                  <div className={`earn-badge__value${swarm.difficulty === 'Medium' ? ' earn-badge__value--med' : swarm.difficulty === 'Hard' ? ' earn-badge__value--hard' : ''}`}>
                    {swarm.difficulty || '--'}
                  </div>
                </div>
              </div>
              <div className="swarm-card__bar">
                <div className="swarm-bar__fill" style={{ width: `${fillPct}%` }} />
              </div>
              <div className="card__footer">
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {fillPct}% full
                </span>
                <button className="btn btn--sm btn--earn" onClick={() => onJoinSwarm(swarm)}>
                  Join Swarm
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
