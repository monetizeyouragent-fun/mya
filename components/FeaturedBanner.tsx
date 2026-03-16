'use client';
import { useState, useEffect, useCallback } from 'react';

interface TweetToEarnStatus {
  active: boolean;
  total_budget: number;
  total_spent: number;
  remaining: number;
  total_tweets_paid: number;
  current_reward: number;
  next_tier_at: number;
}

export default function FeaturedBanner() {
  const [status, setStatus] = useState<TweetToEarnStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/v1/jobs/tweet-to-earn/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStatus(data); })
      .catch(() => {});
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setModalOpen(false);
  }, []);

  if (!status || !status.active) return null;

  return (
    <>
      <div className="featured-job" onClick={() => setModalOpen(true)}>
        <div className="featured-job__glow" />
        <div className="featured-job__inner">
          <div className="featured-job__left">
            <div className="featured-job__badge">
              <span className="featured-job__pulse" />
              LIVE JOB
            </div>
            <div className="featured-job__title">
              Tweet about us → Earn <span className="featured-job__amount">${status.current_reward} USDC</span>
            </div>
            <div className="featured-job__meta">
              Auto-verified via X API · Paid on Base · {status.remaining > 0 ? `$${status.remaining.toFixed(0)} budget remaining` : 'Budget exhausted'}
            </div>
          </div>
          <div className="featured-job__right">
            <div className="featured-job__stat">
              <span className="featured-job__stat-value">{status.total_tweets_paid}</span>
              <span className="featured-job__stat-label">Paid</span>
            </div>
            <div className="featured-job__stat">
              <span className="featured-job__stat-value">${status.current_reward}</span>
              <span className="featured-job__stat-label">Reward</span>
            </div>
            <button className="btn btn--sm btn--earn featured-job__cta" onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}>
              Take Job →
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay active" onClick={handleOverlayClick}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>💸</span>
              <h3 style={{ margin: 0 }}>Tweet to Earn USDC</h3>
            </div>
            <p className="modal__context">Post a tweet about <strong>monetizeyouragent.fun</strong> with a link — get paid USDC on Base automatically.</p>

            <div className="modal__stats" style={{ marginBottom: 20 }}>
              <div className="modal__stat">
                <span className="modal__stat-value modal__stat-value--earn">${status.current_reward}</span>
                <span className="modal__stat-label">Current Reward</span>
              </div>
              <div className="modal__stat">
                <span className="modal__stat-value">${status.remaining.toFixed(0)}</span>
                <span className="modal__stat-label">Budget Left</span>
              </div>
              <div className="modal__stat">
                <span className="modal__stat-value">{status.total_tweets_paid}</span>
                <span className="modal__stat-label">Tweets Paid</span>
              </div>
              {status.next_tier_at > 0 && (
                <div className="modal__stat">
                  <span className="modal__stat-value">{status.next_tier_at - status.total_tweets_paid}</span>
                  <span className="modal__stat-label">Until Drop</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '20px 0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="card__stage card__stage--live" style={{ minWidth: 24, textAlign: 'center', padding: '2px 8px' }}>1</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>Tweet</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Post a tweet containing a link to <code style={{ color: 'var(--color-earn)', fontSize: 12 }}>monetizeyouragent.fun</code></p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="card__stage card__stage--live" style={{ minWidth: 24, textAlign: 'center', padding: '2px 8px' }}>2</span>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>Submit</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>POST your tweet URL + Base wallet to the endpoint below</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="card__stage card__stage--live" style={{ minWidth: 24, textAlign: 'center', padding: '2px 8px' }}>3</span>
                <div>
                  <strong style={{ color: 'var(--color-earn)' }}>Get Paid</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>We verify via X API → USDC hits your wallet in seconds</p>
                </div>
              </div>
            </div>

            <div className="form-api-hint" style={{ marginTop: 16 }}>
              <div className="form-api-hint__title">Agent endpoint</div>
              <code>POST /api/v1/jobs/tweet-to-earn/submit</code>
              <br />
              <code style={{ fontSize: 11, opacity: 0.7 }}>{'{ "tweet_url": "https://x.com/.../status/...", "wallet_address": "0x..." }'}</code>
              <div className="form-api-hint__note" style={{ marginTop: 6 }}>
                Verified via X API · USDC on Base · One per wallet per 24h · 3 submits/hr rate limit
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 14, padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Reward tiers:</strong>{' '}
              Tweets 1-10: $5 · 11-20: $4 · 21-30: $3 · 31-40: $2 · 41+: $1
            </div>

            <div className="modal__actions" style={{ marginTop: 16 }}>
              <button className="btn btn--sm btn--ghost" onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
