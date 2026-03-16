'use client';
import { useState, useRef, useEffect } from 'react';

interface TicketResult {
  ticket_id: string;
  status: string;
  auto_response: string | null;
}

interface TicketDetail {
  ticket: {
    ticket_id: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
  };
  messages: {
    id: number;
    sender: string;
    sender_type: string;
    message: string;
    created_at: string;
  }[];
}

export default function SupportButton() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'form' | 'result' | 'lookup' | 'detail'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  // Result state
  const [result, setResult] = useState<TicketResult | null>(null);

  // Lookup state
  const [lookupId, setLookupId] = useState('');
  const [detail, setDetail] = useState<TicketDetail | null>(null);

  // Reply state
  const [replyMsg, setReplyMsg] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const reset = () => {
    setSubject('');
    setCategory('general');
    setMessage('');
    setName('');
    setContact('');
    setResult(null);
    setError('');
    setView('form');
    setDetail(null);
    setLookupId('');
    setReplyMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, submitter_name: name, submitter_type: 'human', contact: contact || undefined, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit ticket');
      } else {
        setResult(data);
        setView('result');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/support/${lookupId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ticket not found');
      } else {
        setDetail(data);
        setView('detail');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !replyMsg.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/support/${detail.ticket.ticket_id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMsg, sender_name: name || detail.ticket.ticket_id }),
      });
      if (res.ok) {
        setReplyMsg('');
        // Refresh ticket
        const refreshRes = await fetch(`/api/v1/support/${detail.ticket.ticket_id}`);
        if (refreshRes.ok) setDetail(await refreshRes.json());
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send reply');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'auto_resolved': case 'resolved': return 'var(--color-earn)';
      case 'escalated': return 'var(--color-platform)';
      case 'closed': return 'var(--color-text-muted)';
      default: return 'var(--color-infra)';
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(!open); if (!open) reset(); }}
        aria-label="Support"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--color-earn)',
          color: '#000',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 212, 170, 0.3)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? '\u00d7' : '?'}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            zIndex: 1000,
            width: '360px',
            maxHeight: '520px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
              Support
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {view !== 'form' && view !== 'lookup' && (
                <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--color-earn)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  New Ticket
                </button>
              )}
              <button
                onClick={() => setView(view === 'lookup' ? 'form' : 'lookup')}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}
              >
                {view === 'lookup' ? 'Submit Ticket' : 'Check Status'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            {error && (
              <div style={{ padding: '8px 12px', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 'var(--radius-sm)', color: '#ff5050', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            {/* Submit form */}
            {view === 'form' && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
                <input
                  placeholder="Subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  style={inputStyle}
                />
                <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                  <option value="general">General</option>
                  <option value="payment">Payment</option>
                  <option value="verification">Verification</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="swarm">Swarm</option>
                  <option value="job">Job</option>
                  <option value="account">Account</option>
                </select>
                <textarea
                  placeholder="Describe your issue..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <input
                  placeholder="Contact (email/webhook, optional)"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px',
                    background: 'var(--color-earn)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            )}

            {/* Lookup form */}
            {view === 'lookup' && (
              <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  placeholder="Enter ticket ID (e.g. TKT-AB123)"
                  value={lookupId}
                  onChange={e => setLookupId(e.target.value)}
                  required
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px',
                    background: 'var(--color-earn)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Looking up...' : 'Check Status'}
                </button>
              </form>
            )}

            {/* Result after submit */}
            {view === 'result' && result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', marginBottom: '4px' }}>Ticket Created</div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 'var(--text-xl)',
                    color: 'var(--color-earn)',
                    fontWeight: 700,
                    padding: '8px',
                    background: 'var(--color-earn-bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-earn-border)',
                  }}>
                    {result.ticket_id}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>Save this ID to check status later</div>
                </div>
                <div style={{ padding: '8px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
                  <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Status: <span style={{ color: statusColor(result.status) }}>{result.status.replace('_', ' ')}</span>
                  </div>
                  {result.auto_response && (
                    <div style={{ color: 'var(--color-text)', marginTop: '8px', lineHeight: 1.5 }}>
                      {result.auto_response}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ticket detail */}
            {view === 'detail' && detail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <strong style={{ color: 'var(--color-text)' }}>{detail.ticket.subject}</strong>
                  <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: statusColor(detail.ticket.status) }}>{detail.ticket.status.replace('_', ' ')}</span>
                    <span>{detail.ticket.category}</span>
                    <span>{detail.ticket.priority}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                  {detail.messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-sm)',
                        lineHeight: 1.4,
                        background: msg.sender_type === 'user' ? 'var(--color-surface-2)' : msg.sender_type === 'admin' ? 'var(--color-infra-bg)' : 'var(--color-earn-bg)',
                        border: `1px solid ${msg.sender_type === 'user' ? 'var(--color-border)' : msg.sender_type === 'admin' ? 'var(--color-infra-border)' : 'var(--color-earn-border)'}`,
                      }}
                    >
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                        {msg.sender} ({msg.sender_type})
                      </div>
                      {msg.message}
                    </div>
                  ))}
                </div>

                {detail.ticket.status !== 'closed' && (
                  <form onSubmit={handleReply} style={{ display: 'flex', gap: '6px' }}>
                    <input
                      placeholder="Add a reply..."
                      value={replyMsg}
                      onChange={e => setReplyMsg(e.target.value)}
                      required
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: '8px 14px',
                        background: 'var(--color-earn)',
                        color: '#000',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      Send
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
