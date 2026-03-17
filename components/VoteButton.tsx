'use client';
import { useState } from 'react';
import { useToast } from './Toast';

interface VoteButtonProps {
  entryId: number;
  initialVotes: number;
}

export default function VoteButton({ entryId, initialVotes }: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [bumped, setBumped] = useState(false);
  const { showToast } = useToast();

  const handleVote = async (direction: 'up' | 'down') => {
    const prev = userVote;
    let newVotes = votes;

    if (prev === direction) {
      setUserVote(null);
      newVotes += direction === 'up' ? -1 : 1;
    } else {
      if (prev === 'up') newVotes -= 1;
      if (prev === 'down') newVotes += 1;
      setUserVote(direction);
      newVotes += direction === 'up' ? 1 : -1;
    }

    setVotes(newVotes);
    setBumped(true);
    setTimeout(() => setBumped(false), 300);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, direction }),
      });
      if (res.ok) {
        showToast(direction === 'up' ? 'Upvoted!' : 'Downvoted');
      }
    } catch {
      showToast('Vote failed', 'error');
    }
  };

  return (
    <div className="card__voting">
      <button
        className={`vote-btn vote-btn--up${userVote === 'up' ? ' vote-btn--active' : ''}`}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
      </button>
      <span className={`vote-count${bumped ? ' vote-count--bumped' : ''}`}>{votes}</span>
      <button
        className={`vote-btn vote-btn--down${userVote === 'down' ? ' vote-btn--active' : ''}`}
        onClick={() => handleVote('down')}
        aria-label="Downvote"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
  );
}
