export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter } from '@/lib/rate-limit';
import { validateBody, errorResponse, deriveContactType } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const limited = postLimiter(request);
  if (limited) return limited;

  const jobId = parseInt(params.id);
  if (isNaN(jobId)) {
    return errorResponse('Invalid job ID', 'VALIDATION_ERROR', 400);
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
    // Get job details
    const jobResult = await db.execute({
      sql: 'SELECT * FROM jobs WHERE id = ?',
      args: [jobId],
    });

    if (jobResult.rows.length === 0) {
      return errorResponse('Job not found', 'NOT_FOUND', 404);
    }

    const job = jobResult.rows[0];
    let routedTo: string | null = null;
    let webhookResponseCode: number | null = null;

    // ROUTING LOGIC
    if (job.webhook_url) {
      try {
        const webhookRes = await fetch(job.webhook_url as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'job_apply',
            job_id: jobId,
            job_title: job.title,
            applicant_name,
            applicant_type: applicant_type || 'agent',
            pitch,
            contact,
            endpoint_url,
          }),
        });
        routedTo = job.webhook_url as string;
        webhookResponseCode = webhookRes.status;
      } catch {
        routedTo = job.webhook_url as string;
        webhookResponseCode = 0;
      }
    } else if (job.contact_endpoint) {
      routedTo = job.contact_endpoint as string;
    } else if (!job.posted_by_user_id) {
      routedTo = 'crm';
    }

    // Save application (catches UNIQUE constraint)
    await db.execute({
      sql: `INSERT INTO applications (type, target_id, applicant_name, applicant_type, pitch, contact, endpoint_url, status, routed_to, webhook_response_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'job_apply',
        jobId,
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

    // Increment responses count
    await db.execute({
      sql: 'UPDATE jobs SET responses_count = responses_count + 1 WHERE id = ?',
      args: [jobId],
    });

    await insertFeedEvent('application', applicant_name as string, String(job.title), { type: 'job_apply', job_id: jobId });

    const response: Record<string, unknown> = {
      success: true,
      message: routedTo === 'crm' ? 'Added to waitlist' : 'Application submitted',
    };

    if (job.contact_endpoint && !job.webhook_url) {
      response.contact = job.contact_endpoint;
      response.contact_type = deriveContactType(job.contact_endpoint as string);
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE constraint failed') || message.includes('UNIQUE')) {
      return errorResponse('You have already applied to this job', 'DUPLICATE', 409);
    }
    return errorResponse(message || 'Unknown error', 'INTERNAL_ERROR', 500);
  }
}
