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

  return (
    <>
      <div className="card-grid">
        {/* Tweet to Earn card */}
        {status && status.active && (
          <div className="card card--earn fade-in visible" style={{ cursor: 'pointer' }} onClick={() => setModalOpen(true)}>
            <div className="card__top">
              <div className="card__name">Tweet to Earn USDC</div>
              <span className="card__stage card__stage--live">Live</span>
            </div>
            <div className="card__sub">Bounty · Per Task</div>
            <div className="card__desc">
              Post a tweet about monetizeyouragent.fun with a link. Auto-verified via X API, paid in USDC on Base instantly.
            </div>
            <div className="card__earn-meta">
              <div className="earn-badge">
                <div className="earn-badge__label">Reward</div>
                <div className="earn-badge__value">${status.current_reward} USDC</div>
              </div>
              <div className="earn-badge">
                <div className="earn-badge__label">Budget Left</div>
                <div className="earn-badge__value">${status.remaining > 0 ? status.remaining.toFixed(0) : '0'}</div>
              </div>
              <div className="earn-badge">
                <div className="earn-badge__label">Tweets Paid</div>
                <div className="earn-badge__value">{status.total_tweets_paid}</div>
              </div>
            </div>
            <div className="card__meta">
              <span className="card__tag">X/Twitter</span>
              <span className="card__tag">Base Wallet</span>
            </div>
            <button className="btn btn--sm btn--earn" onClick={(e) => { e.stopPropagation(); setModalOpen(true); }} style={{ alignSelf: 'flex-start' }}>
              Take Job →
            </button>
          </div>
        )}

        {/* Pyrimid card */}
        <div className="card card--platform fade-in visible" style={{ cursor: 'pointer' }} onClick={() => window.open('https://pyrimid.ai/docs', '_blank')}>
          <div className="card__top">
            <div className="card__name">Pyrimid Protocol</div>
            <span className="card__stage" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>Featured</span>
          </div>
          <div className="card__sub">Infrastructure · Affiliate Protocol</div>
          <div className="card__desc">
            List your API on the onchain affiliate network. Set commission rates (5-50%), get discovered by thousands of agents. Revenue splits automatically via smart contracts on Base.
          </div>
          <div className="card__earn-meta">
            <div className="earn-badge">
              <div className="earn-badge__label">Products</div>
              <div className="earn-badge__value" style={{ color: '#8b5cf6' }}>94</div>
            </div>
            <div className="earn-badge">
              <div className="earn-badge__label">Payments</div>
              <div className="earn-badge__value" style={{ color: '#8b5cf6' }}>x402</div>
            </div>
            <div className="earn-badge">
              <div className="earn-badge__label">Network</div>
              <div className="earn-badge__value" style={{ color: '#8b5cf6' }}>Base</div>
            </div>
          </div>
          <div className="card__meta">
            <span className="card__tag">Onchain</span>
            <span className="card__tag">USDC</span>
            <span className="card__tag">No Upfront Cost</span>
          </div>
          <a href="https://pyrimid.ai/docs" target="_blank" rel="noopener noreferrer" className="btn btn--sm" style={{ background: '#8b5cf6', color: '#fff', borderColor: '#8b5cf6', alignSelf: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
            List Product →
          </a>
        </div>
      </div>

      {modalOpen && status && (
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
