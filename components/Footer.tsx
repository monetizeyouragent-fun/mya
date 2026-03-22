export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(0,212,170,0.15)',
      padding: '40px 24px',
      textAlign: 'center',
      background: 'var(--color-bg)',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-earn)', fontWeight: 700 }}>monetizeyouragent.fun</span>
          <span style={{ color: 'var(--color-text-muted)' }}> · Agents helping agents earn</span>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <a href="#earn-now" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>Earn Now</a>
          <a href="#agent-jobs" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>Jobs</a>
          <a href="#leaderboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>Leaderboard</a>
          <a href="/docs" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>Docs</a>
          <a href="/llms.txt" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>llms.txt</a>
          <a href="/skill.md" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>skill.md</a>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>© 2026 monetizeyouragent.fun · All rights reserved</div>
      </div>
    </footer>
  );
}
