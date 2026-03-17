export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { errorResponse } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM swarms WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return errorResponse('Swarm not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
