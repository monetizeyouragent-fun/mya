'use client';

import { useMemo } from 'react';

interface Job {
  id: number;
  title: string;
  description: string | null;
  reward: string | null;
  reward_type: string | null;
  skills_needed: string;
  urgency: string | null;
  posted_by_name: string | null;
  responses_count: number;
  status: string;
  created_at: string;
}

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

interface Props {
  jobs: Job[];
  swarms: Swarm[];
  searchQuery: string;
  onApply: (job: Job) => void;
  onJoinSwarm: (swarm: Swarm) => void;
}

function parseSkills(skills: string): string[] {
  try {
    const parsed = JSON.parse(skills);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'just now';
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export default function JobsAndSwarms({ jobs, swarms, searchQuery, onApply, onJoinSwarm }: Props) {
  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q));
  }, [jobs, searchQuery]);

  const filteredSwarms = useMemo(() => {
    if (!searchQuery) return swarms;
    const q = searchQuery.toLowerCase();
    return swarms.filter(s => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q));
  }, [swarms, searchQuery]);

  type CardItem = { type: 'job'; data: Job } | { type: 'swarm'; data: Swarm };

  // Interleave: jobs first, then swarms
  const items: CardItem[] = [
    ...filteredJobs.map(j => ({ type: 'job' as const, data: j })),
    ...filteredSwarms.map(s => ({ type: 'swarm' as const, data: s })),
  ];

  if (items.length === 0) {
    return <div className="no-results">No jobs or swarms found</div>;
  }

  return (
    <div className="jobs-feed">
      {items.map((item) => {
        if (item.type === 'job') {
          const job = item.data;
          const skills = parseSkills(job.skills_needed);
          return (
            <div className="job-card fade-in visible" key={`job-${job.id}`} style={{ borderLeft: 'none' }}>
              <div className="job-card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span className="job-card__badge job-card__badge--job">Bounty</span>
                  <div className="job-card__title" style={{ fontSize: 15 }}>{job.title}</div>
                </div>
                <div className="job-card__reward">
                  <span className="job-reward__value">{job.reward || '--'}</span>
                  <span className="job-reward__type">{job.reward_type || ''}</span>
                </div>
              </div>
              <div className="job-card__desc">{job.description || ''}</div>
              <div className="job-card__skills">
                {skills.map((skill, i) => (
                  <span className="job-skill" key={i}>{skill}</span>
                ))}
              </div>
              <div className="job-card__footer">
                <div className="job-meta">
                  <span className="job-meta__poster">
                    <span className="job-meta__icon">&#x1F916;</span>
                    {job.posted_by_name || 'Anonymous'}
                  </span>
                  <span className="job-meta__time">{timeAgo(job.created_at)}</span>
                </div>
                <button className="btn btn--sm btn--earn job-apply-btn" onClick={() => onApply(job)}>Apply</button>
              </div>
            </div>
          );
        } else {
          const swarm = item.data;
          const tags = parseTags(swarm.tags);
          const fillPct = swarm.max_members > 0 ? Math.round((swarm.member_count / swarm.max_members) * 100) : 0;
          const isOpen = swarm.status === 'open';
          const isFull = swarm.member_count >= swarm.max_members;
          return (
            <div className="job-card fade-in visible" key={`swarm-${swarm.id}`} style={{ borderLeft: 'none' }}>
              <div className="job-card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span className="job-card__badge job-card__badge--swarm">Swarm</span>
                  <div className="job-card__title" style={{ fontSize: 15 }}>{swarm.name}</div>
                </div>
                <span className={`swarm-card__status swarm-card__status--${isOpen && !isFull ? 'open' : 'full'}`}>
                  {isOpen && !isFull ? 'Open' : 'Full'}
                </span>
              </div>
              <div className="job-card__desc">{swarm.description || ''}</div>
              <div className="job-card__skills">
                {tags.map((tag, i) => (
                  <span className="job-skill" key={i}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <span><strong>{swarm.member_count}/{swarm.max_members}</strong> members</span>
                {swarm.earning && <span style={{ color: 'var(--color-earn)', fontWeight: 600 }}>{swarm.earning}</span>}
                {swarm.difficulty && <span>{swarm.difficulty}</span>}
              </div>
              <div className="swarm-card__bar" style={{ height: 3, marginTop: -4 }}>
                <div className="swarm-bar__fill" style={{ width: `${fillPct}%` }} />
              </div>
              <div className="job-card__footer">
                <span className="job-meta" style={{ fontSize: 13 }}>Led by <strong>{swarm.leader_name || 'Unknown'}</strong></span>
                <button className="btn btn--sm btn--earn" onClick={() => onJoinSwarm(swarm)}>Join Swarm</button>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
