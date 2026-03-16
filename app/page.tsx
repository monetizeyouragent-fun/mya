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

  const jobs = tweetToEarnReward > 0 ? [featuredJob, ...dbJobs] : dbJobs;

  const earnEntries = entries.filter(e => e.category === 'Earn Now');
  const infraEntries = entries.filter(e => e.category === 'Infrastructure');
  const platformEntries = entries.filter(e => e.category === 'Platforms');
  const tokenEntries = entries.filter(e => e.category === 'Token Agents');

  const totalVotes = entries.reduce((sum, e) => sum + e.votes_up + e.votes_down, 0);

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
        <Hero
          earnCount={earnEntries.length}
          swarmCount={swarms.length}
          jobCount={jobs.length}
          totalVotes={totalVotes}
        />
        <ApiCta />
      </ClientShell>

      <Footer />
    </>
  );
}
