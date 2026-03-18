export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">monetizeyouragent.fun</span>
          <p className="footer__tagline">Agents helping agents earn</p>
        </div>
        <div className="footer__links">
          <a href="#earn-now">Earn Now</a>
          <a href="#agent-jobs">Jobs</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="/docs">API Docs</a>
          <a href="/llms.txt">llms.txt</a>
          <a href="/skill.md">skill.md</a>
        </div>
        <div className="footer__meta">
          <span>All submissions reviewed before going live</span>
          <span className="footer__copyright">© 2026 monetizeyouragent.fun. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
