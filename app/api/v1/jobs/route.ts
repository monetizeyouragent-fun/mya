export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter, getLimiter } from '@/lib/rate-limit';
import { validateBody, errorResponse, parsePagination, paginatedResponse, deriveContactType } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';
import { getPaymentConfig, getCurrentReward } from '@/lib/tweet-to-earn';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const countResult = await db.execute("SELECT COUNT(*) as total FROM jobs WHERE status = 'active'");
    const totalCount = Number(countResult.rows[0].total);

    const result = await db.execute({
      sql: "SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT ? OFFSET ?",
      args: [limit, offset],
    });

    const rows = result.rows.map((row) => ({
      ...row,
      contact_type: deriveContactType(row.contact_endpoint as string | null),
    }));

    // Include tweet-to-earn featured job if active
    const allJobs: unknown[] = [...rows];
    try {
      const config = await getPaymentConfig();
      const budgetRemaining = Math.max(0, config.total_budget - config.total_spent);
      if (config.job_active === 1 && budgetRemaining > 0) {
        allJobs.unshift({
          id: 'tweet-to-earn',
          title: 'Tweet about monetizeyouragent.fun — Get Paid USDC',
          description: 'Post a tweet mentioning monetizeyouragent.fun. Get paid USDC on Base automatically.',
          reward: `$${getCurrentReward(config.total_tweets_paid)} USDC`,
          reward_type: 'per-task',
          skills_needed: JSON.stringify(['X/Twitter account', 'Base wallet']),
          posted_by_name: 'monetizeyouragent.fun',
          responses_count: config.total_tweets_paid,
          status: 'active',
          contact_type: 'api',
          _featured: true,
          submit_endpoint: '/api/v1/jobs/tweet-to-earn/submit',
        });
      }
    } catch { /* tweet-to-earn tables may not exist yet */ }

    return NextResponse.json(paginatedResponse(allJobs, totalCount + 1, page, limit));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const limited = postLimiter(request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const result = validateBody(body, ['title', 'description']);
  if ('error' in result) return result.error;

  const { title, reward, reward_type, description, skills_needed, webhook_url, contact_endpoint, posted_by_name } = result.data;

  const skillsJson = Array.isArray(skills_needed)
    ? JSON.stringify(skills_needed)
    : JSON.stringify(((skills_needed as string) || '').split(',').map((s: string) => s.trim()).filter(Boolean));

  try {
    const dbResult = await db.execute({
      sql: `INSERT INTO jobs (title, description, reward, reward_type, skills_needed, urgency, posted_by_name, webhook_url, contact_endpoint, status) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, 'active')`,
      args: [
        title as string,
        description as string,
        (reward as string) || null,
        (reward_type as string) || 'per-task',
        skillsJson,
        (posted_by_name as string) || null,
        (webhook_url as string) || null,
        (contact_endpoint as string) || null,
      ],
    });

    await insertFeedEvent('job_posted', (posted_by_name as string) || 'Anonymous', title as string);

    return NextResponse.json({
      success: true,
      message: 'Job created',
      id: Number(dbResult.lastInsertRowid),
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
