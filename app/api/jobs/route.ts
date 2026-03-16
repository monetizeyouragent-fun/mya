export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter } from '@/lib/rate-limit';
import { errorResponse, parsePagination, paginatedResponse, deriveContactType } from '@/lib/validation';

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

    return NextResponse.json(paginatedResponse(rows, totalCount, page, limit));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
