export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter, getPostRateLimitInfo, withRateLimitHeaders } from '@/lib/rate-limit';
import { validateBody, errorResponse } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';

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

  const { title, reward, reward_type, description, skills_needed } = result.data;

  const skillsJson = Array.isArray(skills_needed)
    ? JSON.stringify(skills_needed)
    : JSON.stringify(((skills_needed as string) || '').split(',').map((s: string) => s.trim()).filter(Boolean));

  try {
    await db.execute({
      sql: `INSERT INTO jobs (title, description, reward, reward_type, skills_needed, urgency, status) VALUES (?, ?, ?, ?, ?, 'active', 'active')`,
      args: [title as string, description as string, (reward as string) || null, (reward_type as string) || 'per-task', skillsJson],
    });

    await insertFeedEvent('job_posted', 'Anonymous', title as string);

    return withRateLimitHeaders(
      NextResponse.json({ success: true, message: 'Job posted for review' }),
      getPostRateLimitInfo(request)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
