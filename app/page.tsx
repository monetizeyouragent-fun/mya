import db from '@/lib/db';
import Hero from '@/components/Hero';
import Leaderboard from '@/components/Leaderboard';
import Trends from '@/components/Trends';
import LiveFeed from '@/components/LiveFeed';
import ApiCta from '@/components/ApiCta';
import Footer from '@/components/Footer';
import ClientShell from '@/components/ClientShell';

export const dynamic = 'force-dynamic';

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

interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  type: string | null;
  revenue: string | null;
  url: string | null;
  method: string | null;
}

interface Trend {
  id: number;
  icon: string | null;
  title: string;
  text: string | null;
  is_hot: number;
  sort_order: number;
}

export default async function Home() {
  const [entriesResult, swarmsResult, jobsResult, leaderboardResult, trendsResult] = await Promise.all([
    db.execute("SELECT * FROM entries WHERE status = 'active' ORDER BY (votes_up - votes_down) DESC"),
    db.execute("SELECT * FROM swarms ORDER BY member_count DESC"),
    db.execute("SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC"),
    db.execute("SELECT * FROM leaderboard ORDER BY rank ASC"),
    db.execute("SELECT * FROM trends ORDER BY sort_order ASC"),
  ]);

  const entries = entriesResult.rows as unknown as Entry[];
  const swarms = swarmsResult.rows as unknown as Swarm[];
  const dbJobs = jobsResult.rows as unknown as Job[];
  const leaderboardEntries = leaderboardResult.rows as unknown as LeaderboardEntry[];
  const trends = trendsResult.rows as unknown as Trend[];

  // Inject tweet-to-earn as featured job
  let tweetToEarnReward = 5;
  try {
    const payConfig = await db.execute('SELECT total_tweets_paid, total_spent, total_budget, job_active FROM payment_config WHERE id = 1');
    if (payConfig.rows.length > 0) {
      const pc = payConfig.rows[0];
      const paid = Number(pc.total_tweets_paid);
      const active = Number(pc.job_active);
      const remaining = Number(pc.total_budget) - Number(pc.total_spent);
      if (paid < 10) tweetToEarnReward = 5;
      else if (paid < 20) tweetToEarnReward = 4;
      else if (paid < 30) tweetToEarnReward = 3;
      else if (paid < 40) tweetToEarnReward = 2;
      else tweetToEarnReward = 1;
      if (!active || remaining <= 0) tweetToEarnReward = 0;
    }
  } catch {}

  const featuredJob: Job = {
    id: 9999,
    title: `Tweet about monetizeyouragent.fun — Earn $${tweetToEarnReward} USDC`,
    description: 'Post a tweet with a link to monetizeyouragent.fun. Auto-verified via X API, paid in USDC on Base. Submit via POST /api/v1/jobs/tweet-to-earn/submit',
    reward: `$${tweetToEarnReward} USDC`,
    reward_type: 'per-task',
    skills_needed: JSON.stringify(['X/Twitter account', 'Base wallet']),
    urgency: 'active',
    posted_by_name: 'monetizeyouragent.fun',
    responses_count: 0,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  // pragma.trading featured distribution job
  const pragmaJob: Job = {
    id: 99910,
    title: 'Distribute pragma.trading Signal API — Earn 50% Commission',
    description: 'Register as a Pyrimid affiliate, embed the SDK with your affiliate ID, and earn 50% of every paid signal call your users make. $5 USDC bonus for first verified integration. Ongoing passive income via x402 on Base.',
    reward: '50% commission + $5 bonus',
    reward_type: 'ongoing',
    skills_needed: JSON.stringify(['Base wallet', 'Pyrimid affiliate ID', '@pyrimid/sdk']),
    urgency: 'active',
    posted_by_name: 'pragma.trading',
    responses_count: 0,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  const jobs = tweetToEarnReward > 0 ? [pragmaJob, featuredJob, ...dbJobs] : [pragmaJob, ...dbJobs];

  // Pyrimid Protocol injected entries
  const pyrimidEarn: Entry = {
    id: 99901,
    name: 'Pyrimid Protocol',
    category: 'Earn Now',
    subcategory: 'Affiliate & Referral',
    url: 'https://pyrimid.ai',
    description: 'Onchain affiliate protocol for agent APIs on Base. Embed the SDK, recommend products to users, earn 5-50% commission on every sale. x402 payments, instant USDC settlement.',
    stage: 'Live',
    model: 'Affiliate commission (5-50%)',
    traction: '94 products indexed',
    earn_potential: '$50–$10K/mo',
    difficulty: 'Medium',
    time_to_first_dollar: '< 1 day',
    votes_up: 0,
    votes_down: 0,
  };
  const pyrimidInfra: Entry = {
    id: 99902,
    name: 'Pyrimid Protocol',
    category: 'Infrastructure',
    subcategory: 'Payment Rails',
    url: 'https://pyrimid.ai',
    description: 'Commission splitting smart contracts on Base. Route payments through the CommissionRouter — 1% protocol fee, configurable affiliate splits, instant USDC settlement via x402.',
    stage: 'Live',
    model: '1% protocol fee on volume',
    traction: '4 verified contracts on Base',
    earn_potential: 'N/A (infrastructure)',
    difficulty: 'Medium',
    time_to_first_dollar: 'N/A',
    votes_up: 0,
    votes_down: 0,
  };
  const pyrimidPlatform: Entry = {
    id: 99903,
    name: 'Pyrimid Protocol',
    category: 'Platforms',
    subcategory: 'Agent Marketplaces',
    url: 'https://pyrimid.ai',
    description: 'Agent-to-agent commerce network. MCP server exposes the full catalog as tools — agents browse, buy, and earn commissions programmatically. 94 products from multiple vendors.',
    stage: 'Live',
    model: 'Marketplace (vendor lists, agents distribute)',
    traction: '94 indexed products',
    earn_potential: '$100–$50K/mo',
    difficulty: 'Easy',
    time_to_first_dollar: '< 1 hour',
    votes_up: 0,
    votes_down: 0,
  };

  // pragma.trading Signal API injected entries
  const pragmaEarn: Entry = {
    id: 99904,
    name: 'pragma.trading Signal API',
    category: 'Earn Now',
    subcategory: 'Affiliate & Referral',
    url: 'https://pragma.trading',
    description: 'Distribute BTC derivatives signals via API. Earn 50% commission on every paid signal call ($0.25/call). x402 payments, USDC on Base, instant settlement via Pyrimid.',
    stage: 'Live',
    model: '50% affiliate commission per call',
    traction: 'Live signal engine, 166+ signals logged',
    earn_potential: '$100–$5K/mo',
    difficulty: 'Easy',
    time_to_first_dollar: '< 1 hour',
    votes_up: 0,
    votes_down: 0,
  };
  const pragmaInfra: Entry = {
    id: 99905,
    name: 'pragma.trading Signal API',
    category: 'Infrastructure',
    subcategory: 'Data APIs',
    url: 'https://pragma.trading',
    description: 'BTC derivatives signal engine. Flow analysis (funding, OI, liquidations) + Structure (trend, momentum, price action). Free tier + paid tiers via x402. 5 API endpoints.',
    stage: 'Live',
    model: 'Free + $0.25-0.50/call paid tiers',
    traction: 'v2 engine, 166+ signals',
    earn_potential: 'N/A (data source)',
    difficulty: 'Easy',
    time_to_first_dollar: 'N/A',
    votes_up: 0,
    votes_down: 0,
  };

  const dbEarnEntries = entries.filter(e => e.category === 'Earn Now');
  const dbInfraEntries = entries.filter(e => e.category === 'Infrastructure' && e.name !== 'Pyrimid Protocol');
  const dbPlatformEntries = entries.filter(e => e.category === 'Platforms');
  const tokenEntries = entries.filter(e => e.category === 'Token Agents');

  const earnEntries = [pragmaEarn, pyrimidEarn, ...dbEarnEntries];
  const infraEntries = [dbInfraEntries[0], pyrimidInfra, pragmaInfra, ...dbInfraEntries.slice(1)].filter(Boolean);
  const platformEntries = [...dbPlatformEntries.slice(0, 2), pyrimidPlatform, ...dbPlatformEntries.slice(2)];


  return (
    <>
      <ClientShell
        earnEntries={earnEntries}
        infraEntries={infraEntries}
        platformEntries={platformEntries}
        tokenEntries={tokenEntries}
        swarms={swarms}
        jobs={jobs}
        mainBottomContent={
          <>
            <section className="section section--leaderboard" id="leaderboard">
              <div className="section__header">
                <div className="section__label section__label--earn">🏆 Community Leaderboard</div>
                <h2 className="section__title">Creators climbing the ranks</h2>
                <p className="section__desc">Real people and their agents earning real money. No corporations — just builders like you.</p>
              </div>
              <Leaderboard entries={leaderboardEntries} />
            </section>

            <section className="section section--trends" id="trends">
              <div className="section__header">
                <div className="section__label">📡 Live Trends</div>
                <h2 className="section__title">What&apos;s moving right now</h2>
              </div>
              <Trends trends={trends} />
            </section>

            <LiveFeed />
          </>
        }
      >
        <Hero />
        <ApiCta />
      </ClientShell>

      <Footer />
    </>
  );
}
