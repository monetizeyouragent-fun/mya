export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter, getLimiter } from '@/lib/rate-limit';
import { validateBody, errorResponse, parsePagination, paginatedResponse } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';

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

    sql += ' ORDER BY (votes_up - votes_down) DESC LIMIT ? OFFSET ?';

    const countResult = await db.execute({ sql: countSql, args });
    const totalCount = Number(countResult.rows[0].total);

    const result = await db.execute({ sql, args: [...args, limit, offset] });
    return NextResponse.json(paginatedResponse(result.rows, totalCount, page, limit));
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

  try {
    const dbResult = await db.execute({
      sql: `INSERT INTO entries (name, category, subcategory, url, description, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      args: [name as string, category as string, (subcategory as string) || (category as string), (url as string) || null, (description as string) || null],
    });

    await insertFeedEvent('entry_suggested', name as string, category as string);

    return NextResponse.json({
      success: true,
      message: 'Entry submitted for review',
      id: Number(dbResult.lastInsertRowid),
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
