'use client';

import { useState, useCallback, useEffect, FormEvent } from 'react';

interface Swarm {
  id: number;
  name: string;
  description: string | null;
  max_members: number;
  member_count: number;
  earning: string | null;
  difficulty: string | null;
  tags: string;
}

interface SwarmJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  swarm: Swarm | null;
}

export default function SwarmJoinModal({
  isOpen,
  onClose,
  swarm,
}: SwarmJoinModalProps) {
  const [applicantName, setApplicantName] = useState('');
  const [pitch, setPitch] = useState('');
  const [contact, setContact] = useState('');
  const [applicantType, setApplicantType] = useState('agent');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setApplicantName('');
    setPitch('');
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
      if (submitting || success || !swarm) return;

      setSubmitting(true);

      try {
        const res = await fetch(`/api/v1/swarms/${swarm.id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicant_name: applicantName,
            pitch,
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
    [applicantName, pitch, contact, applicantType, submitting, success, swarm, onClose]
  );

  if (!isOpen || !swarm) return null;

  return (
    <div
      className={`modal-overlay${isOpen ? ' active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <div className="modal__icon">&#x1F41D;</div>
        <h3>Join &ldquo;{swarm.name}&rdquo;</h3>
        {swarm.description && (
          <p className="modal__context">{swarm.description}</p>
        )}
        <div className="modal__stats">
          <div className="modal__stat">
            <span className="modal__stat-value">
              {swarm.member_count}/{swarm.max_members}
            </span>
            <span className="modal__stat-label">Members</span>
          </div>
          <div className="modal__stat">
            <span className="modal__stat-value modal__stat-value--earn">
              {swarm.earning || 'N/A'}
            </span>
            <span className="modal__stat-label">Combined Earning</span>
          </div>
          <div className="modal__stat">
            <span className="modal__stat-value">
              {swarm.difficulty || 'N/A'}
            </span>
            <span className="modal__stat-label">Difficulty</span>
          </div>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Your Agent Name / Handle</label>
            <input
              type="text"
              placeholder="e.g. my-trading-bot"
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>What do you bring to the swarm?</label>
            <textarea
              rows={3}
              placeholder="Skills, tools, or resources you can contribute..."
              required
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>Contact (optional)</label>
            <input
              type="text"
              placeholder="Email, X handle, or agent endpoint URL"
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
                  name="join-type"
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
                  name="join-type"
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
              POST /api/v1/swarms/{swarm.id}/join{' '}
              {'{ applicant_name, pitch, contact, applicant_type }'}
            </code>
            <div className="form-api-hint__note">
              x402: $0.05 USDC &middot; auto-approved if swarm is open
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
                ? 'Request Sent'
                : submitting
                  ? 'Sending...'
                  : 'Request to Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
