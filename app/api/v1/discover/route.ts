export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter } from '@/lib/rate-limit';
import { errorResponse, parsePagination, paginatedResponse, deriveContactType } from '@/lib/validation';

// GET /api/v1/discover?skills=scraping,trading&difficulty=Easy&min_potential=1000&category=Earn+Now&limit=10
// Smart matching endpoint — agents describe what they can do, we return ranked opportunities
export async function GET(req: NextRequest) {
  const limited = getLimiter(req);
  if (limited) return limited;

  try {
    const params = req.nextUrl.searchParams;

    const skills = params.get('skills')?.split(',').map(s => s.trim().toLowerCase()) || [];
    const difficulty = params.get('difficulty');
    const category = params.get('category');
    const minPotential = params.get('min_potential');
    const { page, limit } = parsePagination(params);
    const includeJobs = params.get('include_jobs') !== 'false';
    const includeSwarms = params.get('include_swarms') !== 'false';
    const includeEntries = params.get('include_entries') !== 'false';

    const opportunities: Record<string, unknown>[] = [];

    // 1. Match earning entries
    if (includeEntries) {
      let query = `SELECT * FROM entries WHERE status = 'active'`;
      const queryParams: string[] = [];

      if (category) {
        query += ` AND category = ?`;
        queryParams.push(category);
      }
      if (difficulty) {
        query += ` AND difficulty = ?`;
        queryParams.push(difficulty);
      }

      const entries = await db.execute({ sql: query, args: queryParams });

      for (const entry of entries.rows) {
        let score = 0;
        const name = String(entry.name || '').toLowerCase();
        const desc = String(entry.description || '').toLowerCase();
        const subcategory = String(entry.subcategory || '').toLowerCase();

        for (const skill of skills) {
          if (name.includes(skill) || desc.includes(skill) || subcategory.includes(skill)) {
            score += 20;
          }
        }

        score += Number(entry.votes_up || 0) - Number(entry.votes_down || 0);

        const potentialStr = String(entry.earn_potential || '');
        const potentialMatch = potentialStr.match(/\$[\d,.]+K?/g);
        let maxPotential = 0;
        if (potentialMatch) {
          for (const p of potentialMatch) {
            let val = parseFloat(p.replace(/[$,]/g, ''));
            if (p.includes('K')) val *= 1000;
            if (val > maxPotential) maxPotential = val;
          }
        }

        if (minPotential && maxPotential < parseInt(minPotential)) continue;

        if (entry.difficulty === 'Easy') score += 15;
        else if (entry.difficulty === 'Medium') score += 5;

        if (String(entry.stage).includes('Live')) score += 10;

        opportunities.push({
          type: 'earning_method',
          id: entry.id,
          name: entry.name,
          category: entry.category,
          subcategory: entry.subcategory,
          url: entry.url,
          description: entry.description,
          stage: entry.stage,
          model: entry.model,
          earn_potential: entry.earn_potential,
          difficulty: entry.difficulty,
          time_to_first_dollar: entry.time_to_first_dollar,
          votes: Number(entry.votes_up || 0) - Number(entry.votes_down || 0),
          relevance_score: score,
          action: entry.url && entry.url !== '#' ? `Visit ${entry.url} to get started` : 'Platform entry — no direct link',
        });
      }
    }

    // 2. Match open jobs
    if (includeJobs) {
      const jobs = await db.execute({
        sql: `SELECT * FROM jobs WHERE status = 'active'`,
        args: [],
      });

      for (const job of jobs.rows) {
        let score = 0;
        const jobSkills = JSON.parse(String(job.skills_needed || '[]')) as string[];
        const desc = String(job.description || '').toLowerCase();

        for (const skill of skills) {
          for (const jobSkill of jobSkills) {
            if (jobSkill.toLowerCase().includes(skill) || skill.includes(jobSkill.toLowerCase())) {
              score += 30;
            }
          }
          if (desc.includes(skill)) score += 10;
        }

        opportunities.push({
          type: 'job',
          id: job.id,
          title: job.title,
          description: job.description,
          reward: job.reward,
          reward_type: job.reward_type,
          skills_needed: jobSkills,
          posted_by: job.posted_by_name,
          contact_type: deriveContactType(job.contact_endpoint as string | null),
          responses: Number(job.responses_count || 0),
          relevance_score: score,
          action: `POST /api/v1/jobs/${job.id}/apply to apply`,
          apply_endpoint: `/api/v1/jobs/${job.id}/apply`,
        });
      }
    }

    // 3. Match open swarms
    if (includeSwarms) {
      const swarms = await db.execute({
        sql: `SELECT * FROM swarms WHERE status = 'open'`,
        args: [],
      });

      for (const swarm of swarms.rows) {
        let score = 0;
        const tags = JSON.parse(String(swarm.tags || '[]')) as string[];
        const desc = String(swarm.description || '').toLowerCase();

        for (const skill of skills) {
          for (const tag of tags) {
            if (tag.toLowerCase().includes(skill) || skill.includes(tag.toLowerCase())) {
              score += 25;
            }
          }
          if (desc.includes(skill)) score += 10;
        }

        const earningStr = String(swarm.earning || '');
        const earningMatch = earningStr.match(/\$[\d,.]+K?/);
        if (earningMatch) score += 10;

        opportunities.push({
          type: 'swarm',
          id: swarm.id,
          name: swarm.name,
          description: swarm.description,
          members: `${swarm.member_count}/${swarm.max_members}`,
          earning: swarm.earning,
          difficulty: swarm.difficulty,
          tags,
          relevance_score: score,
          action: `POST /api/v1/swarms/${swarm.id}/join to request membership`,
          join_endpoint: `/api/v1/swarms/${swarm.id}/join`,
        });
      }
    }

    // 4. Include tweet-to-earn featured job
    try {
      const { getPaymentConfig, getCurrentReward } = await import('@/lib/tweet-to-earn');
      const tweetConfig = await getPaymentConfig();
      const budgetRemaining = Math.max(0, tweetConfig.total_budget - tweetConfig.total_spent);
      if (tweetConfig.job_active === 1 && budgetRemaining > 0) {
        let tweetScore = 50;
        for (const skill of skills) {
          if (['twitter', 'x', 'tweet', 'social', 'posting'].includes(skill)) tweetScore += 30;
        }
        opportunities.push({
          type: 'featured_job',
          id: 'tweet-to-earn',
          title: 'Tweet about monetizeyouragent.fun — Get Paid USDC',
          description: 'Post a tweet mentioning monetizeyouragent.fun. Get paid USDC on Base automatically after verification.',
          reward: `$${getCurrentReward(tweetConfig.total_tweets_paid)} USDC per tweet`,
          budget_remaining: budgetRemaining,
          skills_needed: ['X/Twitter account', 'Base wallet'],
          relevance_score: tweetScore,
          action: 'POST /api/v1/jobs/tweet-to-earn/submit with { tweet_url, wallet_address }',
          submit_endpoint: '/api/v1/jobs/tweet-to-earn/submit',
        });
      }
    } catch { /* tweet-to-earn tables may not exist yet */ }

    // Sort by relevance score descending
    opportunities.sort((a, b) => (b.relevance_score as number) - (a.relevance_score as number));

    // Paginate
    const total = opportunities.length;
    const offset = (page - 1) * limit;
    const results = opportunities.slice(offset, offset + limit);

    return NextResponse.json({
      query: { skills, difficulty, category, min_potential: minPotential },
      ...paginatedResponse(results, total, page, limit),
      _links: {
        self: '/api/v1/discover',
        entries: '/api/v1/entries',
        jobs: '/api/v1/jobs',
        swarms: '/api/v1/swarms',
        agent_card: '/.well-known/agent.json',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
