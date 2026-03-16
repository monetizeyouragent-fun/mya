export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { postLimiter, getPostRateLimitInfo, withRateLimitHeaders } from '@/lib/rate-limit';
import { validateBody, errorResponse, deriveContactType } from '@/lib/validation';
import { insertFeedEvent } from '@/lib/feed';
import { deliverWebhook } from '@/lib/webhook';

const TWEET_TO_EARN_VIRTUAL_ID = 9999;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const limited = postLimiter(request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'VALIDATION_ERROR', 400);
  }

  const result = validateBody(body, ['applicant_name']);
  if ('error' in result) return result.error;

  const { applicant_name, applicant_type, pitch, contact, endpoint_url } = result.data;

  // Handle tweet-to-earn featured job (string ID)
  if (params.id === 'tweet-to-earn') {
    try {
      await db.execute({
        sql: `INSERT INTO applications (type, target_id, applicant_name, applicant_type, pitch, contact, endpoint_url, status, routed_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'job_apply',
          TWEET_TO_EARN_VIRTUAL_ID,
          applicant_name as string,
          (applicant_type as string) || 'agent',
          (pitch as string) || null,
          (contact as string) || null,
          (endpoint_url as string) || null,
          'pending',
          'tweet-to-earn',
        ],
      });

      await insertFeedEvent('application', applicant_name as string, 'Tweet-to-Earn', { type: 'job_apply', job_id: 'tweet-to-earn' });

      const response = NextResponse.json({
        success: true,
        message: 'Application submitted',
        job_id: 'tweet-to-earn',
        submit_endpoint: '/api/v1/jobs/tweet-to-earn/submit',
        instructions: 'Submit your tweet via POST /api/v1/jobs/tweet-to-earn/submit with { tweet_url, wallet_address }',
      }, { status: 201 });
      return withRateLimitHeaders(response, getPostRateLimitInfo(request));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('UNIQUE constraint') || message.includes('UNIQUE')) {
        return errorResponse('You have already applied to this job', 'DUPLICATE', 409);
      }
      return errorResponse('Failed to submit application', 'INTERNAL_ERROR', 500);
    }
  }

  // Handle numeric job IDs
  const jobId = parseInt(params.id);
  if (isNaN(jobId)) {
    return errorResponse('Invalid job ID', 'VALIDATION_ERROR', 400);
  }

  try {
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

    // Insert application first to get the ID for webhook tracking
    const appResult = await db.execute({
      sql: `INSERT INTO applications (type, target_id, applicant_name, applicant_type, pitch, contact, endpoint_url, status, routed_to) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      args: [
        'job_apply',
        jobId,
        applicant_name as string,
        (applicant_type as string) || 'agent',
        (pitch as string) || null,
        (contact as string) || null,
        (endpoint_url as string) || null,
        job.webhook_url || job.contact_endpoint || 'crm',
      ],
    });

    const applicationId = Number(appResult.lastInsertRowid);

    if (job.webhook_url) {
      // Use webhook delivery with retry logic (Issue 24)
      const webhookPayload = {
        type: 'job_apply',
        job_id: jobId,
        job_title: job.title as string,
        applicant_name: applicant_name as string,
        applicant_type: (applicant_type as string) || 'agent',
        pitch: (pitch as string) || undefined,
        contact: (contact as string) || undefined,
        endpoint_url: (endpoint_url as string) || undefined,
      };

      const delivery = await deliverWebhook(applicationId, job.webhook_url as string, webhookPayload);
      routedTo = job.webhook_url as string;
      webhookResponseCode = delivery.statusCode;

      // Update application with webhook response
      await db.execute({
        sql: 'UPDATE applications SET routed_to = ?, webhook_response_code = ? WHERE id = ?',
        args: [routedTo, webhookResponseCode, applicationId],
      });
    } else if (job.contact_endpoint) {
      routedTo = job.contact_endpoint as string;
    } else if (!job.posted_by_user_id) {
      routedTo = 'crm';
      await db.execute({
        sql: "UPDATE applications SET status = 'waitlisted', routed_to = 'crm' WHERE id = ?",
        args: [applicationId],
      });
    }

    await db.execute({
      sql: 'UPDATE jobs SET responses_count = responses_count + 1 WHERE id = ?',
      args: [jobId],
    });

    await insertFeedEvent('application', applicant_name as string, String(job.title), { type: 'job_apply', job_id: jobId });

    const responseData: Record<string, unknown> = {
      success: true,
      message: routedTo === 'crm' ? 'Added to waitlist' : 'Application submitted',
    };

    if (job.contact_endpoint && !job.webhook_url) {
      responseData.contact = job.contact_endpoint;
      responseData.contact_type = deriveContactType(job.contact_endpoint as string);
    }

    const response = NextResponse.json(responseData, { status: 201 });
    return withRateLimitHeaders(response, getPostRateLimitInfo(request));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE constraint failed') || message.includes('UNIQUE')) {
      return errorResponse('You have already applied to this job', 'DUPLICATE', 409);
    }
    return errorResponse('Failed to submit application', 'INTERNAL_ERROR', 500);
  }
}
