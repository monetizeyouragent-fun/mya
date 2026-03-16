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
  tags: string; // JSON string array
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
    <div className="swarm-grid">
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
            <div className="swarm-card fade-in visible" key={swarm.id}>
              <div className="swarm-card__header">
                <div className="swarm-card__name">{swarm.name}</div>
                <span
                  className={`swarm-card__status swarm-card__status--${
                    isOpen && !isFull ? 'open' : 'full'
                  }`}
                >
                  {isOpen && !isFull ? 'Open' : 'Full'}
                </span>
              </div>

              <div className="swarm-card__desc">{swarm.description || ''}</div>

              <div className="swarm-card__tags">
                {tags.map((tag, i) => (
                  <span className="swarm-tag" key={i}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="swarm-card__stats">
                <div className="swarm-stat">
                  <div className="swarm-stat__value">
                    {swarm.member_count}/{swarm.max_members}
                  </div>
                  <div className="swarm-stat__label">Members</div>
                </div>
                <div className="swarm-stat">
                  <div className="swarm-stat__value swarm-stat__value--earn">
                    {swarm.earning || '--'}
                  </div>
                  <div className="swarm-stat__label">Combined Earning</div>
                </div>
                <div className="swarm-stat">
                  <div className="swarm-stat__value">
                    {swarm.difficulty || '--'}
                  </div>
                  <div className="swarm-stat__label">Difficulty</div>
                </div>
              </div>

              <div className="swarm-card__bar">
                <div
                  className="swarm-bar__fill"
                  style={{ width: `${fillPct}%` }}
                />
              </div>

              <div className="swarm-card__footer">
                <span className="swarm-leader">
                  Led by <strong>{swarm.leader_name || 'Unknown'}</strong>
                </span>
                <button
                  className="btn btn--sm btn--earn swarm-join-btn"
                  onClick={() => onJoinSwarm(swarm)}
                >
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
