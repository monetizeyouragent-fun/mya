'use client';
import { useState, useCallback } from 'react';

interface Application {
  id: number;
  type: string;
  target_id: number;
  applicant_name: string;
  applicant_type: string;
  pitch: string | null;
  contact: string | null;
  status: string;
  routed_to: string | null;
  created_at: string;
}

interface PendingEntry {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  url: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

interface SupportTicket {
  ticket_id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  submitter_name: string;
  submitter_type: string;
  contact: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: number;
  sender: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authSecret, setAuthSecret] = useState('');
  const [tab, setTab] = useState<'applications' | 'entries' | 'support'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  // Support state
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchData = useCallback(async (secret: string) => {
    setLoading(true);
    try {
      const [appsRes, entriesRes, ticketsRes] = await Promise.all([
        fetch('/api/admin/applications', { headers: { 'x-auth-secret': secret } }),
        fetch('/api/admin/entries/pending', { headers: { 'x-auth-secret': secret } }),
        fetch('/api/admin/support', { headers: { 'x-auth-secret': secret } }),
      ]);

      if (appsRes.ok) setApplications(await appsRes.json());
      if (entriesRes.ok) setPendingEntries(await entriesRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
    } catch {}
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/applications', {
      headers: { 'x-auth-secret': password },
    });
    if (res.ok) {
      setAuthSecret(password);
      setAuthed(true);
      fetchData(password);
    } else {
      alert('Invalid password');
    }
  };

  const updateAppStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/applications/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-secret': authSecret },
      body: JSON.stringify({ status }),
    });
    fetchData(authSecret);
  };

  const handleEntryAction = async (id: number, action: string) => {
    await fetch(`/api/admin/entries/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-secret': authSecret },
      body: JSON.stringify({ action }),
    });
    fetchData(authSecret);
  };

  const loadTicketMessages = async (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      return;
    }
    try {
      const res = await fetch(`/api/v1/support/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setTicketMessages(prev => ({ ...prev, [ticketId]: data.messages }));
      }
    } catch {}
    setExpandedTicket(ticketId);
  };

  const handleAdminReply = async (ticketId: string, resolve: boolean = false) => {
    if (!replyText.trim()) return;
    await fetch(`/api/admin/support/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-secret': authSecret },
      body: JSON.stringify({ message: replyText, resolve }),
    });
    setReplyText('');
    // Refresh messages and tickets
    const res = await fetch(`/api/v1/support/${ticketId}`);
    if (res.ok) {
      const data = await res.json();
      setTicketMessages(prev => ({ ...prev, [ticketId]: data.messages }));
    }
    fetchData(authSecret);
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await fetch(`/api/admin/support/${ticketId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-secret': authSecret },
      body: JSON.stringify({ status }),
    });
    fetchData(authSecret);
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#ff5050';
      case 'high': return 'var(--color-platform)';
      case 'normal': return 'var(--color-infra)';
      default: return 'var(--color-text-muted)';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'escalated': return 'var(--color-platform)';
      case 'open': return 'var(--color-infra)';
      case 'auto_resolved': case 'resolved': return 'var(--color-earn)';
      case 'closed': return 'var(--color-text-muted)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const ticketCounts = {
    open: tickets.filter(t => t.status === 'open').length,
    escalated: tickets.filter(t => t.status === 'escalated').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'auto_resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  const filteredTickets = statusFilter
    ? tickets.filter(t => t.status === statusFilter)
    : tickets;

  if (!authed) {
    return (
      <div className="admin-layout">
        <div className="admin-login">
          <h2>Admin Login</h2>
          <form className="modal-form" onSubmit={handleLogin}>
            <div className="form-row">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            <div className="modal__actions">
              <button type="submit" className="btn btn--sm btn--earn">Login</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage applications, entries, and support tickets</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'applications' ? ' active' : ''}`}
          onClick={() => setTab('applications')}
        >
          Applications ({applications.length})
        </button>
        <button
          className={`admin-tab${tab === 'entries' ? ' active' : ''}`}
          onClick={() => setTab('entries')}
        >
          Pending Entries ({pendingEntries.length})
        </button>
        <button
          className={`admin-tab${tab === 'support' ? ' active' : ''}`}
          onClick={() => setTab('support')}
        >
          Support ({ticketCounts.escalated + ticketCounts.open})
        </button>
      </div>

      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}

      {tab === 'applications' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Applicant</th>
                <th>Pitch</th>
                <th>Contact</th>
                <th>Routed To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.type}</td>
                  <td>
                    <strong style={{ color: 'var(--color-text)' }}>{app.applicant_name}</strong>
                    <br />
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{app.applicant_type}</span>
                  </td>
                  <td>{app.pitch?.slice(0, 60)}{app.pitch && app.pitch.length > 60 ? '...' : ''}</td>
                  <td>{app.contact}</td>
                  <td>{app.routed_to}</td>
                  <td>
                    <span className={`status-badge status-badge--${app.status}`}>{app.status}</span>
                  </td>
                  <td>
                    {app.status === 'pending' || app.status === 'waitlisted' ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn--sm btn--earn" onClick={() => updateAppStatus(app.id, 'accepted')}>Accept</button>
                        <button className="btn btn--sm btn--ghost" onClick={() => updateAppStatus(app.id, 'rejected')}>Reject</button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No applications yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'entries' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>URL</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingEntries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ color: 'var(--color-text)', fontWeight: 600 }}>{entry.name}</td>
                  <td>{entry.category}</td>
                  <td>{entry.url ? <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-earn)' }}>{entry.url.slice(0, 30)}...</a> : '-'}</td>
                  <td>{entry.description?.slice(0, 80)}{entry.description && entry.description.length > 80 ? '...' : ''}</td>
                  <td><span className="status-badge status-badge--pending">{entry.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn--sm btn--earn" onClick={() => handleEntryAction(entry.id, 'approve')}>Approve</button>
                      <button className="btn btn--sm btn--ghost" onClick={() => handleEntryAction(entry.id, 'reject')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingEntries.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No pending entries</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'support' && (
        <div>
          {/* Status counts */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Escalated', count: ticketCounts.escalated, color: 'var(--color-platform)', value: 'escalated' },
              { label: 'Open', count: ticketCounts.open, color: 'var(--color-infra)', value: 'open' },
              { label: 'Resolved', count: ticketCounts.resolved, color: 'var(--color-earn)', value: 'resolved' },
              { label: 'Closed', count: ticketCounts.closed, color: 'var(--color-text-muted)', value: 'closed' },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(statusFilter === s.value ? '' : s.value)}
                style={{
                  padding: '8px 16px',
                  background: statusFilter === s.value ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                  border: `1px solid ${statusFilter === s.value ? s.color : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: s.color,
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                }}
              >
                {s.label}: {s.count}
              </button>
            ))}
          </div>

          {/* Ticket list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTickets.map(ticket => (
              <div
                key={ticket.ticket_id}
                style={{
                  background: 'var(--color-surface-2)',
                  border: `1px solid ${ticket.status === 'escalated' ? 'var(--color-platform-border)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                {/* Ticket header */}
                <div
                  onClick={() => loadTicketMessages(ticket.ticket_id)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{ticket.ticket_id}</span>
                      <span style={{ color: statusColor(ticket.status), fontSize: 'var(--text-xs)', fontWeight: 600 }}>{ticket.status.replace('_', ' ')}</span>
                      <span style={{ color: priorityColor(ticket.priority), fontSize: 'var(--text-xs)' }}>{ticket.priority}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{ticket.category}</span>
                    </div>
                    <div style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{ticket.subject}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      by {ticket.submitter_name} ({ticket.submitter_type}) &middot; {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-lg)' }}>
                    {expandedTicket === ticket.ticket_id ? '\u25b2' : '\u25bc'}
                  </span>
                </div>

                {/* Expanded ticket */}
                {expandedTicket === ticket.ticket_id && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
                    {/* Messages */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0', maxHeight: '300px', overflowY: 'auto' }}>
                      {(ticketMessages[ticket.ticket_id] || []).map(msg => (
                        <div
                          key={msg.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-sm)',
                            lineHeight: 1.5,
                            background: msg.sender_type === 'user' ? 'var(--color-surface-3)' : msg.sender_type === 'admin' ? 'var(--color-infra-bg)' : 'var(--color-earn-bg)',
                            border: `1px solid ${msg.sender_type === 'user' ? 'var(--color-border)' : msg.sender_type === 'admin' ? 'var(--color-infra-border)' : 'var(--color-earn-border)'}`,
                          }}
                        >
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                            <strong>{msg.sender}</strong> ({msg.sender_type}) &middot; {new Date(msg.created_at).toLocaleString()}
                          </div>
                          <div style={{ color: 'var(--color-text)' }}>{msg.message}</div>
                        </div>
                      ))}
                    </div>

                    {/* Admin actions */}
                    {ticket.status !== 'closed' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            placeholder="Type admin reply..."
                            value={expandedTicket === ticket.ticket_id ? replyText : ''}
                            onChange={e => setReplyText(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--color-text)',
                              fontSize: 'var(--text-sm)',
                              outline: 'none',
                            }}
                          />
                          <button
                            className="btn btn--sm btn--earn"
                            onClick={() => handleAdminReply(ticket.ticket_id, false)}
                          >
                            Reply
                          </button>
                          <button
                            className="btn btn--sm btn--earn"
                            onClick={() => handleAdminReply(ticket.ticket_id, true)}
                            style={{ background: 'var(--color-earn)', opacity: 0.8 }}
                          >
                            Reply &amp; Resolve
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {ticket.status !== 'resolved' && (
                            <button className="btn btn--sm btn--earn" onClick={() => updateTicketStatus(ticket.ticket_id, 'resolved')}>Resolve</button>
                          )}
                          {ticket.status !== 'escalated' && (
                            <button className="btn btn--sm btn--ghost" onClick={() => updateTicketStatus(ticket.ticket_id, 'escalated')} style={{ borderColor: 'var(--color-platform)' }}>Escalate</button>
                          )}
                          <button className="btn btn--sm btn--ghost" onClick={() => updateTicketStatus(ticket.ticket_id, 'closed')}>Close</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                No tickets{statusFilter ? ` with status "${statusFilter}"` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
