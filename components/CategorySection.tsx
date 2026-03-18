'use client';
import { useState, useMemo, useCallback } from 'react';
import VoteButton from './VoteButton';

interface Entry {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  url: string | null;
  description: string | null;
  stage: string | null;
  model: string | null;
  traction: string | null;
  earn_potential: string | null;
  difficulty: string | null;
  time_to_first_dollar: string | null;
  votes_up: number;
  votes_down: number;
}

interface CategorySectionProps {
  category: string;
  colorKey: string;
  entries: Entry[];
  label: string;
  title: string;
  description: string;
  sectionId: string;
  searchQuery: string;
}

function getStageClass(stage: string | null): string {
  if (!stage) return '';
  const s = stage.toLowerCase();
  if (s.includes('live') || s.includes('ga')) return 'card__stage--live';
  if (s.includes('beta') || s.includes('rolling')) return 'card__stage--beta';
  if (s.includes('standard')) return 'card__stage--standard';
  if (s.includes('research')) return 'card__stage--research';
  return 'card__stage--live';
}

function getDifficultyClass(difficulty: string | null): string {
  if (!difficulty) return '';
  const d = difficulty.toLowerCase();
  if (d.includes('hard')) return 'earn-badge__value--hard';
  if (d.includes('medium') || d.includes('med')) return 'earn-badge__value--med';
  return '';
}

function matchSearch(entry: Entry, query: string): boolean {
  const fields = [
    entry.name,
    entry.description,
    entry.category,
    entry.subcategory,
    entry.model,
    entry.traction,
  ].filter(Boolean) as string[];
  return fields.some((f) => f.toLowerCase().includes(query));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="search-highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function CategorySection({
  category,
  colorKey,
  entries,
  label,
  title,
  description,
  sectionId,
  searchQuery,
}: CategorySectionProps) {
  const [activeSub, setActiveSub] = useState<string>('All');
  const [expanded, setExpanded] = useState(false);

  const subcategories = useMemo(() => {
    const subs = new Set<string>();
    entries.forEach((e) => {
      if (e.subcategory) subs.add(e.subcategory);
    });
    return Array.from(subs);
  }, [entries]);

  const [voteOverrides, setVoteOverrides] = useState<Record<number, number>>({});

  const handleVoteChange = useCallback((entryId: number, delta: number) => {
    setVoteOverrides(prev => ({ ...prev, [entryId]: (prev[entryId] || 0) + delta }));
  }, []);

  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (activeSub !== 'All') {
      filtered = filtered.filter((e) => e.subcategory === activeSub);
    }

    if (searchQuery) {
      filtered = filtered.filter((e) => matchSearch(e, searchQuery.toLowerCase()));
    }

    // Sort by net votes descending (including local overrides)
    filtered = [...filtered].sort((a, b) => {
      const aNet = (a.votes_up - a.votes_down) + (voteOverrides[a.id] || 0);
      const bNet = (b.votes_up - b.votes_down) + (voteOverrides[b.id] || 0);
      return bNet - aNet;
    });

    return filtered;
  }, [entries, activeSub, searchQuery, voteOverrides]);

  const handleTabClick = (sub: string) => {
    setActiveSub(sub);
  };

  const isEarnOrToken = category === 'Earn Now' || category === 'Token Agents';

  return (
    <section className={`section section--${colorKey}`} id={sectionId}>
      <div className="section__header">
        <div className={`section__label section__label--${colorKey}`}>{label}</div>
        <h2 className="section__title">{title}</h2>
        <p className="section__desc">{description}</p>
      </div>

      {subcategories.length > 1 && (
        <div className="subcategory-tabs">
          <button
            className={`sub-tab${activeSub === 'All' ? ` active--${colorKey}` : ''}`}
            onClick={() => handleTabClick('All')}
          >
            All ({entries.length})
          </button>
          {subcategories.map((sub) => {
            const count = entries.filter((e) => e.subcategory === sub).length;
            return (
              <button
                key={sub}
                className={`sub-tab${activeSub === sub ? ` active--${colorKey}` : ''}`}
                onClick={() => handleTabClick(sub)}
              >
                {sub} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="card-grid">
        {filteredEntries.length === 0 ? (
          <div className="no-results">No results found</div>
        ) : (
          (expanded ? filteredEntries : filteredEntries.slice(0, 9)).map((entry) => {
            const stageClass = getStageClass(entry.stage);
            const netVotes = entry.votes_up - entry.votes_down;
            const hasEarnMeta =
              entry.earn_potential && isEarnOrToken;
            const isInspiration =
              entry.difficulty && entry.difficulty.includes('not available');

            const tags: string[] = [];
            if (entry.model) tags.push(entry.model);
            if (entry.traction) tags.push(entry.traction);

            const linkUrl =
              entry.url && entry.url !== '#' ? entry.url : null;

            return (
              <div
                key={entry.id}
                className={`card card--${colorKey} fade-in visible`}
              >
                <div className="card__top">
                  <div>
                    <div className="card__name">
                      {highlightSearch(entry.name, searchQuery)}
                    </div>
                    <div className="card__sub">{entry.subcategory}</div>
                  </div>
                  {entry.stage && (
                    <span className={`card__stage ${stageClass}`}>
                      {entry.stage}
                    </span>
                  )}
                </div>

                <div className="card__desc">
                  {entry.description
                    ? highlightSearch(entry.description, searchQuery)
                    : ''}
                </div>

                {tags.length > 0 && (
                  <div className="card__meta">
                    {tags.map((tag, i) => (
                      <span key={i} className="card__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {hasEarnMeta && !isInspiration && (
                  <div className="card__earn-meta">
                    <div className="earn-badge">
                      <div className="earn-badge__label">Potential</div>
                      <div className="earn-badge__value">
                        {entry.earn_potential}
                      </div>
                    </div>
                    <div className="earn-badge">
                      <div className="earn-badge__label">Difficulty</div>
                      <div
                        className={`earn-badge__value ${getDifficultyClass(entry.difficulty)}`}
                      >
                        {entry.difficulty}
                      </div>
                    </div>
                    <div className="earn-badge">
                      <div className="earn-badge__label">First $</div>
                      <div className="earn-badge__value">
                        {entry.time_to_first_dollar}
                      </div>
                    </div>
                  </div>
                )}

                <div className="card__footer">
                  <VoteButton entryId={entry.id} initialVotes={netVotes} onVoteChange={handleVoteChange} />
                  {linkUrl && (
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`card__link card__link--${colorKey}`}
                    >
                      Visit &rarr;
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {!expanded && filteredEntries.length > 9 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => setExpanded(true)}
          >
            Show all {filteredEntries.length} entries →
          </button>
        </div>
      )}
    </section>
  );
}
