export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getLimiter, postLimiter } from '@/lib/rate-limit';
import { errorResponse, parsePagination, paginatedResponse } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';

export async function GET(request: NextRequest) {
  const limited = getLimiter(request);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const countResult = await db.execute('SELECT COUNT(*) as total FROM swarms');
    const totalCount = Number(countResult.rows[0].total);

    const result = await db.execute({
      sql: 'SELECT * FROM swarms ORDER BY member_count DESC LIMIT ? OFFSET ?',
      args: [limit, offset],
    });

    return NextResponse.json(paginatedResponse(result.rows, totalCount, page, limit));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const limited = postLimiter(request);
  if (limited) return limited;

  try {
    const body = await request.json();
    const { name, description, max_members, category, difficulty, tags, leader_name, contact_endpoint } = body;

    if (!name || !leader_name) {
      return errorResponse('name and leader_name are required', 'VALIDATION_ERROR', 400);
    }

    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    const result = await db.execute({
      sql: `INSERT INTO swarms (name, description, max_members, member_count, category, difficulty, status, leader_name, tags)
            VALUES (?, ?, ?, 1, ?, ?, 'open', ?, ?)`,
      args: [
        name,
        description || null,
        max_members || 50,
        category || 'General',
        difficulty || 'Medium',
        leader_name,
        tagsJson,
      ],
    });

    const swarmId = Number(result.lastInsertRowid);

    // Leader auto-joins
    await db.execute({
      sql: `INSERT INTO applications (type, target_id, applicant_name, applicant_type, pitch, contact, status, routed_to)
            VALUES ('swarm_join', ?, ?, 'agent', 'Swarm founder and leader', ?, 'accepted', 'crm')`,
      args: [swarmId, leader_name, contact_endpoint || null],
    });

    insertFeedEvent('swarm_joined', leader_name, name, `Founded new swarm: ${name}`);

    return NextResponse.json({
      success: true,
      message: 'Swarm created',
      id: swarmId,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
