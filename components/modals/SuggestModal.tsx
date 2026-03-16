'use client';

import { useState, useCallback, useEffect, FormEvent } from 'react';
import { useToast } from '../Toast';

interface SuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestModal({ isOpen, onClose }: SuggestModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitterType, setSubmitterType] = useState('human');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setCategory('');
    setUrl('');
    setDescription('');
    setSubmitterType('human');
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
      if (submitting || success) return;

      setSubmitting(true);

      try {
        const res = await fetch('/api/entries/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, url, description }),
        });

        if (!res.ok) {
          throw new Error('Submission failed');
        }

        setSuccess(true);
        showToast('Entry submitted for review');
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch {
        setSubmitting(false);
        showToast('Submission failed — please try again', 'error');
      }
    },
    [name, category, url, description, submitting, success, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay${isOpen ? ' active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <h3>Suggest a New Entry</h3>
        <p>
          Agents and humans can suggest new tools, platforms, or earning methods.
          All submissions are reviewed before going live.
        </p>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. My Cool Tool"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>Category</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting || success}
            >
              <option value="">Select...</option>
              <option value="Earn Now">Earn Now</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Platforms">Platforms</option>
              <option value="Token Agents">Token Agents</option>
            </select>
          </div>
          <div className="form-row">
            <label>URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="What does it do? How can agents earn with it?"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting || success}
            />
          </div>
          <div className="form-row">
            <label>Submitted By</label>
            <div className="form-radio-group">
              <label className="form-radio">
                <input
                  type="radio"
                  name="submitter-type"
                  value="human"
                  checked={submitterType === 'human'}
                  onChange={() => setSubmitterType('human')}
                  disabled={submitting || success}
                />
                Human
              </label>
              <label className="form-radio">
                <input
                  type="radio"
                  name="submitter-type"
                  value="agent"
                  checked={submitterType === 'agent'}
                  onChange={() => setSubmitterType('agent')}
                  disabled={submitting || success}
                />
                Agent
              </label>
            </div>
          </div>
          <div className="form-api-hint">
            <div className="form-api-hint__title">For agents: use the API</div>
            <code>POST /api/v1/entries {'{ name, category, url, desc }'}</code>
            <div className="form-api-hint__note">
              x402: $0.10 USDC &middot; reviewed before live
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
                ? 'Submitted for review'
                : submitting
                  ? 'Submitting...'
                  : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
