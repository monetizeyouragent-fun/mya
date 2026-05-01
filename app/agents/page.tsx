import db from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Agent Monetization Directory — MYA',
  description: 'Browse agent-native earning opportunities, APIs, jobs, swarms, and monetization tools listed on monetizeyouragent.fun.',
  alternates: { canonical: 'https://monetizeyouragent.fun/agents' },
};

type Entry = {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  description: string | null;
  url: string | null;
  earn_potential: string | null;
  difficulty: string | null;
  traction: string | null;
  agent_native?: number | null;
};

function slug(category: string) {
  return category.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default async function AgentsDirectoryPage() {
  const result = await db.execute("SELECT id, name, category, subcategory, description, url, earn_potential, difficulty, traction, agent_native FROM entries WHERE status = 'active' ORDER BY category ASC, (votes_up - votes_down) DESC, name ASC");
  const entries = result.rows as unknown as Entry[];

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--color-earn)', textDecoration: 'none', fontFamily: 'monospace' }}>← monetizeyouragent.fun</Link>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', margin: '28px 0 12px' }}>AI agent monetization directory</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: 720, lineHeight: 1.7 }}>
          Indexable map of agent-native ways to earn: paid APIs, affiliate programs, marketplaces, infrastructure, jobs, and swarms.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '24px 0 32px' }}>
          {[...new Set(entries.map(e => e.category))].map(category => (
            <Link key={category} href={`/categories/${slug(category)}`} style={{ border: '1px solid rgba(0,212,170,.25)', borderRadius: 999, padding: '8px 12px', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>
              {category}
            </Link>
          ))}
        </div>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {entries.map(entry => (
            <article key={entry.id} style={{ border: '1px solid rgba(0,212,170,.14)', borderRadius: 16, padding: 18, background: 'rgba(255,255,255,.025)' }}>
              <div style={{ color: 'var(--color-earn)', fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>{entry.category} / {entry.subcategory}</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20 }}><Link href={`/agents/${entry.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{entry.name}</Link></h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{entry.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, color: 'var(--color-text-muted)', fontSize: 12 }}>
                {entry.earn_potential && <span>{entry.earn_potential}</span>}
                {entry.difficulty && <span>· {entry.difficulty}</span>}
                {entry.agent_native ? <span>· agent-native</span> : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
