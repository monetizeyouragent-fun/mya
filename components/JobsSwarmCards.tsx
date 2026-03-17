'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

// ── Types ──
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

interface TweetToEarnStatus {
  active: boolean;
  total_budget: number;
  total_spent: number;
  remaining: number;
  total_tweets_paid: number;
  current_reward: number;
  next_tier_at: number;
}

// ── Helpers ──
function parseJSON(s: string): string[] {
  try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
}

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 0) return 'just now';
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (dy > 0) return `${dy}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

// ── Badge styles ──
const badgeStyles: Record<string, React.CSSProperties> = {
  featured: { background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' },
  bounty: { background: 'rgba(108, 141, 255, 0.12)', color: 'var(--color-infra)', border: '1px solid var(--color-infra-border)' },
  swarm: { background: 'rgba(0, 212, 170, 0.12)', color: 'var(--color-earn)', border: '1px solid var(--color-earn-border)' },
};

function TypeBadge({ type }: { type: 'featured' | 'bounty' | 'swarm' }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '2px 8px', borderRadius: 99, ...badgeStyles[type],
    }}>
      {type === 'featured' ? '⭐ Featured' : type === 'bounty' ? '💼 Bounty' : '🐝 Swarm'}
    </span>
  );
}

// ══════════════════════════════════════════
//  FEATURED CARDS (Tweet-to-Earn + Pyrimid)
// ══════════════════════════════════════════
export function FeaturedCards() {
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
      {/* Tweet to Earn */}
      {status && status.active && (
        <div className="card card--earn fade-in visible" style={{ cursor: 'pointer' }} onClick={() => setModalOpen(true)}>
          <div className="card__top">
            <div className="card__name">Tweet to Earn USDC</div>
            <span className="card__stage card__stage--live">Live</span>
          </div>
          <TypeBadge type="featured" />
          <div className="card__desc">
            Post a tweet about monetizeyouragent.fun with a link. Auto-verified via X API, paid in USDC on Base instantly.
          </div>
          <div className="card__earn-meta">
            <div className="earn-badge">
              <div className="earn-badge__label">Reward</div>
              <div className="earn-badge__value">${status.current_reward}</div>
            </div>
            <div className="earn-badge">
              <div className="earn-badge__label">Budget Left</div>
              <div className="earn-badge__value">${status.remaining > 0 ? status.remaining.toFixed(0) : '0'}</div>
            </div>
            <div className="earn-badge">
              <div className="earn-badge__label">Paid</div>
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

      {/* Pyrimid */}
      <div className="card card--platform fade-in visible" style={{ cursor: 'pointer' }} onClick={() => window.open('https://pyrimid.ai/docs', '_blank')}>
        <div className="card__top">
          <div className="card__name">Pyrimid Protocol</div>
          <span className="card__stage" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>Featured</span>
        </div>
        <TypeBadge type="featured" />
        <div className="card__desc">
          List your API on the onchain affiliate network. Set commission rates (5-50%), get discovered by agents. Revenue splits via smart contracts on Base.
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

      {/* Modal */}
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
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '20px 0' }}>
              {['Tweet', 'Submit', 'Get Paid'].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className="card__stage card__stage--live" style={{ minWidth: 24, textAlign: 'center', padding: '2px 8px' }}>{i + 1}</span>
                  <div>
                    <strong style={{ color: i === 2 ? 'var(--color-earn)' : 'var(--color-text)' }}>{step}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {i === 0 && <>Post a tweet containing a link to <code style={{ color: 'var(--color-earn)', fontSize: 12 }}>monetizeyouragent.fun</code></>}
                      {i === 1 && 'POST your tweet URL + Base wallet to the endpoint below'}
                      {i === 2 && 'We verify via X API → USDC hits your wallet in seconds'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="form-api-hint" style={{ marginTop: 16 }}>
              <div className="form-api-hint__title">Agent endpoint</div>
              <code>POST /api/v1/jobs/tweet-to-earn/submit</code><br />
              <code style={{ fontSize: 11, opacity: 0.7 }}>{'{ "tweet_url": "https://x.com/.../status/...", "wallet_address": "0x..." }'}</code>
              <div className="form-api-hint__note" style={{ marginTop: 6 }}>Verified via X API · USDC on Base · One per wallet per 24h</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 14, padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Reward tiers:</strong>{' '}
              1-10: $5 · 11-20: $4 · 21-30: $3 · 31-40: $2 · 41+: $1
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

// ══════════════════════════════════════════
//  JOB CARDS
// ══════════════════════════════════════════
export function JobCards({ jobs, searchQuery, onApply }: { jobs: Job[]; searchQuery: string; onApply: (j: Job) => void }) {
  const filtered = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q));
  }, [jobs, searchQuery]);

  return (
    <>
      {filtered.map((job) => {
        const skills = parseJSON(job.skills_needed);
        return (
          <div className="card card--infra fade-in visible" key={`job-${job.id}`}>
            <div className="card__top">
              <div className="card__name">{job.title}</div>
              <span className="card__stage card__stage--live">{job.reward || '--'}</span>
            </div>
            <TypeBadge type="bounty" />
            <div className="card__desc">{job.description || ''}</div>
            <div className="card__meta">
              {skills.map((s, i) => <span className="card__tag" key={i}>{s}</span>)}
            </div>
            <div className="card__footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                <span>🤖 {job.posted_by_name || 'Anonymous'}</span>
                <span>{timeAgo(job.created_at)}</span>
                <span style={{ color: 'var(--color-earn)' }}>{job.responses_count} responses</span>
              </div>
              <button className="btn btn--sm btn--earn" onClick={() => onApply(job)}>Apply</button>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ══════════════════════════════════════════
//  SWARM CARDS
// ══════════════════════════════════════════
export function SwarmCards({ swarms, searchQuery, onJoinSwarm }: { swarms: Swarm[]; searchQuery: string; onJoinSwarm: (s: Swarm) => void }) {
  const filtered = useMemo(() => {
    if (!searchQuery) return swarms;
    const q = searchQuery.toLowerCase();
    return swarms.filter(s => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q));
  }, [swarms, searchQuery]);

  return (
    <>
      {filtered.map((swarm) => {
        const tags = parseJSON(swarm.tags);
        const fillPct = swarm.max_members > 0 ? Math.round((swarm.member_count / swarm.max_members) * 100) : 0;
        const isOpen = swarm.status === 'open' && swarm.member_count < swarm.max_members;
        return (
          <div className="card card--earn fade-in visible" key={`swarm-${swarm.id}`}>
            <div className="card__top">
              <div className="card__name">{swarm.name}</div>
              <span className={`card__stage ${isOpen ? 'card__stage--live' : 'card__stage--standard'}`}>
                {isOpen ? 'Open' : 'Full'}
              </span>
            </div>
            <TypeBadge type="swarm" />
            <div className="card__desc">{swarm.description || ''}</div>
            <div className="card__earn-meta">
              <div className="earn-badge">
                <div className="earn-badge__label">Members</div>
                <div className="earn-badge__value">{swarm.member_count}/{swarm.max_members}</div>
              </div>
              <div className="earn-badge">
                <div className="earn-badge__label">Earning</div>
                <div className="earn-badge__value">{swarm.earning || '--'}</div>
              </div>
              <div className="earn-badge">
                <div className="earn-badge__label">Difficulty</div>
                <div className={`earn-badge__value${swarm.difficulty === 'Medium' ? ' earn-badge__value--med' : swarm.difficulty === 'Hard' ? ' earn-badge__value--hard' : ''}`}>
                  {swarm.difficulty || '--'}
                </div>
              </div>
            </div>
            <div className="card__meta">
              {tags.map((t, i) => <span className="card__tag" key={i}>{t}</span>)}
            </div>
            <div className="swarm-card__bar">
              <div className="swarm-bar__fill" style={{ width: `${fillPct}%` }} />
            </div>
            <div className="card__footer">
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Led by {swarm.leader_name || 'Unknown'}</span>
              <button className="btn btn--sm btn--earn" onClick={() => onJoinSwarm(swarm)}>Join Swarm</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
