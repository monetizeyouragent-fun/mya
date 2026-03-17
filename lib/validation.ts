import { NextResponse } from 'next/server';

const LIMITS: Record<string, number> = {
  name: 100,
  title: 100,
  applicant_name: 100,
  leader_name: 100,
  posted_by_name: 100,
  description: 2000,
  pitch: 1000,
  text: 1000,
  url: 500,
  endpoint_url: 500,
  webhook_url: 500,
  contact_endpoint: 500,
  contact: 500,
  category: 100,
  subcategory: 100,
  reward: 100,
  reward_type: 100,
  icon: 50,
  method: 200,
  revenue: 100,
  earning: 100,
  subject: 200,
  message: 5000,
  submitter_name: 100,
  submitter_type: 20,
  sender_name: 100,
};

/** Strip HTML/script tags from a string */
export function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/** Trim and sanitize a string value */
export function clean(val: unknown): string {
  if (typeof val !== 'string') return '';
  return sanitize(val.trim());
}

/** Validate and clean an object's string fields. Returns error response or cleaned body. */
export function validateBody(
  body: Record<string, unknown>,
  required: string[]
): { error: NextResponse } | { data: Record<string, unknown> } {
  const cleaned: Record<string, unknown> = { ...body };

  // Check required fields
  for (const field of required) {
    const val = body[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      return {
        error: NextResponse.json(
          { error: `${field} is required`, code: 'VALIDATION_ERROR' },
          { status: 400 }
        ),
      };
    }
  }

  // Trim, sanitize, and check length limits for all string fields
  for (const [key, val] of Object.entries(body)) {
    if (typeof val === 'string') {
      const cleanedVal = clean(val);
      const limit = LIMITS[key] || 2000;
      if (cleanedVal.length > limit) {
        return {
          error: NextResponse.json(
            { error: `${key} must be ${limit} characters or less`, code: 'VALIDATION_ERROR' },
            { status: 400 }
          ),
        };
      }
      cleaned[key] = cleanedVal;
    }
  }

  return { data: cleaned };
}

/** Derive contact_type from a contact_endpoint string */
export function deriveContactType(endpoint: string | null | undefined): string {
  if (!endpoint) return 'other';
  const ep = String(endpoint);
  if (ep.startsWith('http://') || ep.startsWith('https://')) return 'webhook';
  if (ep.startsWith('webhook://')) return 'webhook';
  if (ep.includes('@')) return 'email';
  return 'other';
}

/** Standard error response */
export function errorResponse(
  message: string,
  code: string,
  status: number
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

/** Parse pagination params from search params */
export function parsePagination(searchParams: URLSearchParams): { page: number; limit: number; offset: number } {
  let page = parseInt(searchParams.get('page') || '1');
  let limit = parseInt(searchParams.get('limit') || '20');
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit)) limit = 20;
  else if (limit < 0) limit = 0;
  else if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** Build paginated response */
export function paginatedResponse(
  data: unknown[],
  totalCount: number,
  page: number,
  limit: number
) {
  return {
    data,
    count: totalCount,
    page,
    limit,
    total_pages: Math.ceil(totalCount / limit),
  };
}
