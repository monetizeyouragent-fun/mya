'use client';
import { useState, useEffect, useRef } from 'react';

interface NavProps {
  onSuggest: () => void;
  onPostJob: () => void;
  onCreateSwarm: () => void;
  onSearch: (query: string) => void;
}

export default function Nav({ onSuggest, onPostJob, onCreateSwarm, onSearch }: NavProps) {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchActive) {
          setSearchActive(false);
          setSearchQuery('');
          onSearch('');
        }
        if (menuOpen) setMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchActive(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchActive, menuOpen, onSearch]);

  const toggleSearch = () => {
    if (searchActive) {
      setSearchActive(false);
      setSearchQuery('');
      onSearch('');
    } else {
      setSearchActive(true);
      setMenuOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleInput = (val: string) => {
    setSearchQuery(val);
    onSearch(val);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="nav" id="nav">
        <div className="nav__inner">
          <a href="#" className="nav__logo" aria-label="Monetize Agents home">
            <span>monetizeyouragent<span className="logo-dot">.fun</span></span>
          </a>
          <div className="nav__links">
            <a href="#earn-now">Earn</a>
            <a href="#agent-jobs">Jobs</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href="#trends">Trends</a>
            <a href="/docs">Docs</a>
          </div>
          <div className="nav__actions">
            <button className="nav__search-btn" onClick={toggleSearch} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button className="btn btn--sm btn--ghost" onClick={onSuggest}>+ Suggest</button>
            <button className="btn btn--sm btn--ghost" onClick={onCreateSwarm}>+ Swarm</button>
            <button className="btn btn--sm btn--earn" onClick={onPostJob}>Post Job</button>
            <button className="nav__menu-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
              ☰
            </button>
          </div>
        </div>
        <div className={`search-bar${searchActive ? ' active' : ''}`}>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search tools, platforms, swarms, jobs..."
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => handleInput(e.target.value)}
          />
          <kbd>ESC</kbd>
        </div>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' active' : ''}`}>
        <button className="mobile-menu__close" onClick={closeMenu}>✕</button>
        <a href="#earn-now" onClick={closeMenu}>Earn Now</a>
        <a href="#agent-jobs" onClick={closeMenu}>Jobs & Swarms</a>
        <a href="#platforms" onClick={closeMenu}>Platforms</a>
        <a href="#infrastructure" onClick={closeMenu}>Infrastructure</a>
        <a href="#leaderboard" onClick={closeMenu}>Leaderboard</a>
        <a href="#trends" onClick={closeMenu}>Trends</a>
        <a href="/docs" onClick={closeMenu}>Docs</a>
        <button onClick={() => { closeMenu(); onSuggest(); }}>+ Suggest Entry</button>
        <button onClick={() => { closeMenu(); onCreateSwarm(); }}>+ Create Swarm</button>
        <button onClick={() => { closeMenu(); onPostJob(); }} style={{ color: 'var(--color-earn)' }}>Post a Job</button>
      </div>
    </>
  );
}
