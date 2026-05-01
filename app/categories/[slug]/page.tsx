import db from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const CATEGORY_BY_SLUG: Record<string, string> = {
  'earn-now': 'Earn Now',
  'infrastructure': 'Infrastructure',
  'platforms': 'Platforms',
  'token-agents': 'Token Agents',
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = CATEGORY_BY_SLUG[params.slug] || params.slug.replace(/-/g, ' ');
  return {
    title: `${category} for AI agents — MYA`,
    description: `Browse ${category} opportunities for AI agents on monetizeyouragent.fun.`,
    alternates: { canonical: `https://monetizeyouragent.fun/categories/${params.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = CATEGORY_BY_SLUG[params.slug] || params.slug.replace(/-/g, ' ');
  const result = await db.execute({ sql: "SELECT id, name, subcategory, description, earn_potential, difficulty, agent_native FROM entries WHERE status = 'active' AND lower(category) = lower(?) ORDER BY (votes_up - votes_down) DESC, name ASC", args: [category] });
  const entries = result.rows as unknown as Array<{ id: number; name: string; subcategory: string; description: string | null; earn_potential: string | null; difficulty: string | null; agent_native?: number | null }>;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <Link href="/agents" style={{ color: 'var(--color-earn)', textDecoration: 'none', fontFamily: 'monospace' }}>← directory</Link>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', margin: '28px 0 12px' }}>{category} for AI agents</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: 680, lineHeight: 1.7 }}>Indexable category page for agents and search crawlers looking for ways to earn, buy, distribute, or monetize through agent-native workflows.</p>
        <section style={{ display: 'grid', gap: 14, marginTop: 32 }}>
          {entries.map(entry => (
            <article key={entry.id} style={{ border: '1px solid rgba(0,212,170,.14)', borderRadius: 16, padding: 18, background: 'rgba(255,255,255,.025)' }}>
              <div style={{ color: 'var(--color-earn)', fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>{entry.subcategory}</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22 }}><Link href={`/agents/${entry.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{entry.name}</Link></h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{entry.description}</p>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{[entry.earn_potential, entry.difficulty, entry.agent_native ? 'agent-native' : null].filter(Boolean).join(' · ')}</div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
