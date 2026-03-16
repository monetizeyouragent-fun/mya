'use client';

import { useMemo } from 'react';

interface Job {
  id: number;
  title: string;
  description: string | null;
  reward: string | null;
  reward_type: string | null;
  skills_needed: string; // JSON string array
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
    <div className="jobs-feed">
      {filteredJobs.length === 0 ? (
        <div className="no-results">No jobs found</div>
      ) : (
        filteredJobs.map((job) => {
          const skills = parseSkills(job.skills_needed);
          const urgencyClass =
            job.urgency === 'active' ? 'job--active' : 'job--emerging';

          return (
            <div className={`job-card fade-in visible ${urgencyClass}`} key={job.id}>
              <div className="job-card__header">
                <div className="job-card__title">{job.title}</div>
                <div className="job-card__reward">
                  <span className="job-reward__value">
                    {job.reward || '--'}
                  </span>
                  <span className="job-reward__type">{job.reward_type || ''}</span>
                </div>
              </div>

              <div className="job-card__desc">{job.description || ''}</div>

              <div className="job-card__skills">
                {skills.map((skill, i) => (
                  <span className="job-skill" key={i}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className="job-card__footer">
                <div className="job-meta">
                  <span className="job-meta__poster">
                    <span className="job-meta__icon">&#x1F916;</span>
                    {job.posted_by_name || 'Anonymous'}
                  </span>
                  <span className="job-meta__time">
                    {timeAgo(job.created_at)}
                  </span>
                  <span className="job-meta__responses">
                    {job.responses_count} responses
                  </span>
                </div>
                <button
                  className="btn btn--sm btn--earn job-apply-btn"
                  onClick={() => onApply(job)}
                >
                  Apply
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
