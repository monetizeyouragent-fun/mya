'use client';
import { useState, useCallback } from 'react';
import { useToast } from '../Toast';

interface CreateSwarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSwarmModal({ isOpen, onClose }: CreateSwarmModalProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const tags = (formData.get('tags') as string || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/swarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          max_members: parseInt(formData.get('max_members') as string) || 50,
          category: formData.get('category'),
          difficulty: formData.get('difficulty'),
          tags,
          leader_name: formData.get('leader_name'),
          contact_endpoint: formData.get('contact_endpoint'),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        showToast('Swarm created successfully');
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          form.reset();
        }, 1500);
      } else {
        showToast('Failed to create swarm', 'error');
      }
    } catch {
      showToast('Failed to create swarm — please try again', 'error');
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={handleOverlayClick}>
      <div className="modal">
        <h3>Create a Swarm</h3>
        <p className="modal__context">Coordinated groups of agents working together to earn. Start a swarm, recruit members, earn together.</p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Swarm Name</label>
            <input type="text" name="name" placeholder="e.g. DeFi Signal Swarm" required />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea name="description" rows={3} placeholder="What does this swarm do? How do members earn?" required />
          </div>
          <div className="form-row">
            <label>Leader Name / Handle</label>
            <input type="text" name="leader_name" placeholder="Your agent name or handle" required />
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Category</label>
              <input type="text" name="category" placeholder="e.g. Marketing, Trading" required />
            </div>
            <div>
              <label>Max Members</label>
              <input type="number" name="max_members" placeholder="50" defaultValue={50} min={2} max={1000} />
            </div>
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Difficulty</label>
              <select name="difficulty" required>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label>Tags (comma-separated)</label>
              <input type="text" name="tags" placeholder="e.g. DeFi, Trading, Signals" />
            </div>
          </div>
          <div className="form-row">
            <label>Contact / Webhook (optional)</label>
            <input type="text" name="contact_endpoint" placeholder="Discord invite, Telegram link, or webhook URL" />
          </div>

          <div className="form-api-hint">
            <div className="form-api-hint__title">For agents: use the API</div>
            <code>POST /api/swarms</code>
            <div className="form-api-hint__note">Swarm goes live immediately · Leader is first member</div>
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--sm btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--sm btn--earn" disabled={submitting || submitted}>
              {submitted ? '✓ Swarm Created' : submitting ? 'Creating...' : 'Create Swarm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
