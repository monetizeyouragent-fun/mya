export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter } from '@/lib/rate-limit';
import { validateBody, errorResponse } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const limited = postLimiter(request);
  if (limited) return limited;

  const swarmId = parseInt(params.id);
  if (isNaN(swarmId)) {
    return errorResponse('Invalid swarm ID', 'VALIDATION_ERROR', 400);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const result = validateBody(body, ['applicant_name']);
  if ('error' in result) return result.error;

  const { applicant_name, applicant_type, pitch, contact, endpoint_url } = result.data;

  try {
    // Get swarm details
    const swarmResult = await db.execute({
      sql: 'SELECT * FROM swarms WHERE id = ?',
      args: [swarmId],
    });

    if (swarmResult.rows.length === 0) {
      return errorResponse('Swarm not found', 'NOT_FOUND', 404);
    }

    const swarm = swarmResult.rows[0];

    if (swarm.status === 'full' || swarm.status === 'closed') {
      return errorResponse('Swarm is not accepting new members', 'VALIDATION_ERROR', 400);
    }

    let routedTo: string | null = null;
    let webhookResponseCode: number | null = null;

    if (swarm.leader_user_id) {
      const userResult = await db.execute({
        sql: 'SELECT webhook_url FROM users WHERE id = ?',
        args: [swarm.leader_user_id],
      });
      if (userResult.rows.length > 0 && userResult.rows[0].webhook_url) {
        try {
          const webhookRes = await fetch(userResult.rows[0].webhook_url as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'swarm_join',
              swarm_id: swarmId,
              swarm_name: swarm.name,
              applicant_name,
              applicant_type: applicant_type || 'agent',
              pitch,
              contact,
              endpoint_url,
            }),
          });
          routedTo = userResult.rows[0].webhook_url as string;
          webhookResponseCode = webhookRes.status;
        } catch {
          routedTo = userResult.rows[0].webhook_url as string;
          webhookResponseCode = 0;
        }
      }
    }

    if (!routedTo) {
      routedTo = 'crm';
    }

    // Save application (catches UNIQUE constraint)
    await db.execute({
      sql: `INSERT INTO applications (type, target_id, applicant_name, applicant_type, pitch, contact, endpoint_url, status, routed_to, webhook_response_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'swarm_join',
        swarmId,
        applicant_name as string,
        (applicant_type as string) || 'agent',
        (pitch as string) || null,
        (contact as string) || null,
        (endpoint_url as string) || null,
        routedTo === 'crm' ? 'waitlisted' : 'pending',
        routedTo,
        webhookResponseCode,
      ],
    });

    await insertFeedEvent('swarm_joined', applicant_name as string, String(swarm.name), { swarm_id: swarmId });

    return NextResponse.json({
      success: true,
      message: routedTo === 'crm' ? 'Added to waitlist' : 'Join request submitted',
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE constraint failed') || message.includes('UNIQUE')) {
      return errorResponse('You have already applied to this swarm', 'DUPLICATE', 409);
    }
    return errorResponse(message || 'Unknown error', 'INTERNAL_ERROR', 500);
  }
}
