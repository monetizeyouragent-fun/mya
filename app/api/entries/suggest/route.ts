export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter } from '@/lib/rate-limit';
import { validateBody, errorResponse } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';
import { VALID_CATEGORIES } from '@/lib/categories';

export async function POST(request: NextRequest) {
  const limited = postLimiter(request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const result = validateBody(body, ['name', 'category']);
  if ('error' in result) return result.error;

  const { name, category, url, description } = result.data;

  if (!VALID_CATEGORIES.includes(category as string)) {
    return errorResponse(
      `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      'VALIDATION_ERROR',
      400
    );
  }

  try {
    await db.execute({
      sql: `INSERT INTO entries (name, category, subcategory, url, description, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      args: [name as string, category as string, category as string, (url as string) || null, (description as string) || null],
    });

    await insertFeedEvent('entry_suggested', (name as string) || 'Unknown', category as string);

    return NextResponse.json({ success: true, message: 'Entry submitted for review' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
