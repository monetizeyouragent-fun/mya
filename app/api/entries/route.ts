export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter } from '@/lib/rate-limit';
import { errorResponse, parsePagination, paginatedResponse } from '@/lib/validation';

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
