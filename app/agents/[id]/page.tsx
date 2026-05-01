import db from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Entry = {
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
  agent_native?: number | null;
};

async function getEntry(id: string) {
  const result = await db.execute({ sql: "SELECT * FROM entries WHERE id = ? AND status = 'active' LIMIT 1", args: [id] });
  return result.rows[0] as unknown as Entry | undefined;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const entry = await getEntry(params.id);
  if (!entry) return { title: 'Agent opportunity not found — MYA' };
  return {
    title: `${entry.name} — Agent monetization opportunity`,
    description: entry.description || `Explore ${entry.name} on monetizeyouragent.fun.`,
    alternates: { canonical: `https://monetizeyouragent.fun/agents/${entry.id}` },
    openGraph: { title: `${entry.name} — MYA`, description: entry.description || undefined, url: `https://monetizeyouragent.fun/agents/${entry.id}` },
  };
}

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const entry = await getEntry(params.id);
  if (!entry) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: entry.name,
    description: entry.description,
    url: entry.url || `https://monetizeyouragent.fun/agents/${entry.id}`,
    applicationCategory: 'AI Agent Monetization',
    offers: entry.earn_potential ? { '@type': 'Offer', description: entry.earn_potential } : undefined,
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '48px 24px' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article style={{ maxWidth: 820, margin: '0 auto' }}>
        <Link href="/agents" style={{ color: 'var(--color-earn)', textDecoration: 'none', fontFamily: 'monospace' }}>← all opportunities</Link>
        <div style={{ color: 'var(--color-earn)', fontSize: 13, fontFamily: 'monospace', marginTop: 32 }}>{entry.category} / {entry.subcategory}</div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', margin: '12px 0' }}>{entry.name}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 20, lineHeight: 1.6 }}>{entry.description}</p>
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '32px 0' }}>
          {[['Model', entry.model], ['Earn potential', entry.earn_potential], ['Difficulty', entry.difficulty], ['Time to first dollar', entry.time_to_first_dollar], ['Traction', entry.traction], ['Stage', entry.stage]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ border: '1px solid rgba(0,212,170,.14)', borderRadius: 14, padding: 16 }}>
              <dt style={{ color: 'var(--color-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{k}</dt>
              <dd style={{ margin: '8px 0 0', color: 'var(--color-text)' }}>{v}</dd>
            </div>
          ))}
        </dl>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {entry.url && <a href={entry.url} target="_blank" rel="noopener" style={{ background: 'var(--color-earn)', color: '#03110d', padding: '12px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>Open opportunity →</a>}
          <Link href="/api/v1/discover?agent_native=true" style={{ border: '1px solid rgba(0,212,170,.35)', color: 'var(--color-earn)', padding: '12px 18px', borderRadius: 10, textDecoration: 'none' }}>Agent API</Link>
          <Link href="https://pyrimid.ai" style={{ border: '1px solid rgba(0,212,170,.35)', color: 'var(--color-earn)', padding: '12px 18px', borderRadius: 10, textDecoration: 'none' }}>Monetize with Pyrimid</Link>
        </div>
      </article>
    </main>
  );
}
