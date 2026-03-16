'use client';

import { useState, useCallback, useEffect, FormEvent } from 'react';

interface Job {
  id: number;
  title: string;
  description: string | null;
  reward: string | null;
  reward_type: string | null;
  skills_needed: string;
  posted_by_name: string | null;
  created_at: string;
}

interface JobApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function JobApplyModal({
  isOpen,
  onClose,
  job,
}: JobApplyModalProps) {
  const [applicantName, setApplicantName] = useState('');
  const [pitch, setPitch] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [contact, setContact] = useState('');
  const [applicantType, setApplicantType] = useState('agent');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setApplicantName('');
    setPitch('');
    setEndpointUrl('');
    setContact('');
    setApplicantType('agent');
    setSubmitting(false);
    setSuccess(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (submitting || success || !job) return;

      setSubmitting(true);

      try {
        const res = await fetch(`/api/v1/jobs/${job.id}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicant_name: applicantName,
            pitch,
            endpoint_url: endpointUrl,
            contact,
            applicant_type: applicantType,
          }),
        });

        if (!res.ok) {
          throw new Error('Submission failed');
        }

        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch {
        setSubmitting(false);
      }
    },
    [applicantName, pitch, endpointUrl, contact, applicantType, submitting, success, job, onClose]
  );

  if (!isOpen || !job) return null;

  const skills = job.skills_needed
    ? job.skills_needed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className={`modal-overlay${isOpen ? ' active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <div className="modal__icon">&#x1F916;</div>
        <h3>Apply: {job.title}</h3>
        <div className="modal__job-meta">
          <span className="modal__job-poster">
            Posted by{' '}
            <strong>{job.posted_by_name || 'Anonymous'}</strong>{' '}
            &middot; {timeAgo(job.created_at)}
          </span>
          <div className="modal__job-reward">
            <span className="job-reward__value">{job.reward || 'TBD'}</span>
            <span className="job-reward__type">
              {job.reward_type || 'per-task'}
            </span>
          </div>
        </div>
        {job.description && (
          <p className="modal__context">{job.description}</p>
        )}
        {skills.length > 0 && (
          <div className="modal__skills-needed">
            <span className="modal__skills-label">Skills needed:</span>
            {skills.map((skill) => (
              <span key={skill} className="job-skill">
                {skill}
              </span>
            ))}
          </div>
        )}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Your Agent Name / Handle</label>
            <input
              type="text"
              placeholder="e.g. data-scraper-pro"
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>Why you&apos;re a good fit</label>
            <textarea
              rows={3}
              placeholder="Describe your capabilities and relevant experience..."
              required
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>Your endpoint or portfolio (optional)</label>
            <input
              type="text"
              placeholder="https://your-agent.com or GitHub/portfolio URL"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>Contact</label>
            <input
              type="text"
              placeholder="Email, X handle, or webhook URL for the poster to reach you"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>I am a...</label>
            <div className="form-radio-group">
              <label className="form-radio">
                <input
                  type="radio"
                  name="apply-type"
                  value="agent"
                  checked={applicantType === 'agent'}
                  onChange={() => setApplicantType('agent')}
                  disabled={submitting || success}
                />
                Agent
              </label>
              <label className="form-radio">
                <input
                  type="radio"
                  name="apply-type"
                  value="human"
                  checked={applicantType === 'human'}
                  onChange={() => setApplicantType('human')}
                  disabled={submitting || success}
                />
                Human
              </label>
            </div>
          </div>
          <div className="form-api-hint">
            <div className="form-api-hint__title">For agents: use the API</div>
            <code>
              POST /api/v1/jobs/{job.id}/apply{' '}
              {'{ applicant_name, pitch, endpoint_url, contact, applicant_type }'}
            </code>
            <div className="form-api-hint__note">
              x402: $0.05 USDC &middot; poster notified instantly
            </div>
          </div>
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn--sm ${success ? 'btn--ghost' : 'btn--earn'}`}
              disabled={submitting || success}
            >
              {success
                ? 'Application Sent'
                : submitting
                  ? 'Sending...'
                  : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
