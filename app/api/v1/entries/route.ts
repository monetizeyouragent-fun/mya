export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter, getLimiter, withRateLimitHeaders, getGetRateLimitInfo, getPostRateLimitInfo } from '@/lib/rate-limit';
import { validateBody, errorResponse, parsePagination, paginatedResponse } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';
import { VALID_CATEGORIES } from '@/lib/categories';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const { page, limit, offset } = parsePagination(searchParams);

    let countSql = 'SELECT COUNT(*) as total FROM entries WHERE status = ?';
    let sql = 'SELECT * FROM entries WHERE status = ?';
    const args: string[] = ['active'];

    if (category) {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      args.push(category);
    }
    if (subcategory) {
      sql += ' AND subcategory = ?';
      countSql += ' AND subcategory = ?';
      args.push(subcategory);
    }

    const agentNative = searchParams.get('agent_native');
    if (agentNative === 'true') {
      sql += ' AND agent_native = 1';
      countSql += ' AND agent_native = 1';
    }

    sql += ' ORDER BY (votes_up - votes_down) DESC LIMIT ? OFFSET ?';

    const countResult = await db.execute({ sql: countSql, args });
    const totalCount = Number(countResult.rows[0].total);

    const result = await db.execute({ sql, args: [...args, limit, offset] });
    return withRateLimitHeaders(NextResponse.json(paginatedResponse(result.rows, totalCount, page, limit)), getGetRateLimitInfo(request));
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

  const result = validateBody(body, ['name', 'category']);
  if ('error' in result) return result.error;

  const { name, category, subcategory, url, description } = result.data;

  if (!VALID_CATEGORIES.includes(category as string)) {
    return errorResponse(
      `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      'VALIDATION_ERROR',
      400
    );
  }

  try {
    // Check for duplicate by name (case-insensitive) or URL
    const dupeChecks = [];
    dupeChecks.push(
      db.execute({
        sql: 'SELECT id FROM entries WHERE LOWER(name) = LOWER(?)',
        args: [name as string],
      })
    );
    if (url) {
      dupeChecks.push(
        db.execute({
          sql: 'SELECT id FROM entries WHERE url = ? AND url IS NOT NULL',
          args: [url as string],
        })
      );
    }
    const dupeResults = await Promise.all(dupeChecks);
    for (const dupeResult of dupeResults) {
      if (dupeResult.rows.length > 0) {
        return NextResponse.json({
          error: 'An entry with this name or URL already exists',
          code: 'DUPLICATE',
          existing_id: Number(dupeResult.rows[0].id),
        }, { status: 409 });
      }
    }

    const dbResult = await db.execute({
      sql: `INSERT INTO entries (name, category, subcategory, url, description, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      args: [name as string, category as string, (subcategory as string) || (category as string), (url as string) || null, (description as string) || null],
    });

    await insertFeedEvent('entry_suggested', name as string, category as string);

    return withRateLimitHeaders(NextResponse.json({
      success: true,
      message: 'Entry submitted for review',
      id: Number(dbResult.lastInsertRowid),
    }, { status: 201 }), getPostRateLimitInfo(request));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    return errorResponse(message || 'Failed to create entry', 'INTERNAL_ERROR', 500);
  }
}
