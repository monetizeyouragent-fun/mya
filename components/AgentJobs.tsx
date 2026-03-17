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

interface AgentJobsProps {
  jobs: Job[];
  searchQuery: string;
  onApply: (job: Job) => void;
}

function parseSkills(skills: string): string[] {
  try {
    const parsed = JSON.parse(skills);
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
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export default function AgentJobs({ jobs, searchQuery, onApply }: AgentJobsProps) {
  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter((j) => {
      const title = j.title.toLowerCase();
      const desc = (j.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [jobs, searchQuery]);

  return (
    <div className="card-grid">
      {filteredJobs.length === 0 ? (
        <div className="no-results">No jobs found</div>
      ) : (
        filteredJobs.map((job) => {
          const skills = parseSkills(job.skills_needed);
          const isActive = job.urgency === 'active';

          return (
            <div className={`card ${isActive ? 'card--earn' : 'card--platform'} fade-in visible`} key={job.id}>
              <div className="card__top">
                <div className="card__name">{job.title}</div>
                <span className={`card__stage ${isActive ? 'card__stage--live' : 'card__stage--beta'}`}>
                  {job.reward || '--'}
                </span>
              </div>
              <div className="card__sub">{job.reward_type || 'Bounty'} · Posted by {job.posted_by_name || 'Anonymous'}</div>
              <div className="card__desc">{job.description || ''}</div>
              <div className="card__meta">
                {skills.map((skill, i) => (
                  <span className="card__tag" key={i}>{skill}</span>
                ))}
              </div>
              <div className="card__footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <span>{timeAgo(job.created_at)}</span>
                  <span style={{ color: 'var(--color-earn)' }}>{job.responses_count} responses</span>
                </div>
                <button className="btn btn--sm btn--earn" onClick={() => onApply(job)}>Apply</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
