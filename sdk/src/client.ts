import {
  MonetizeAgentError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  DuplicateError,
} from './errors';

import type {
  PaginationParams,
  PaginatedResponse,
  Entry,
  SuggestEntryParams,
  Job,
  CreateJobParams,
  ApplyJobParams,
  Swarm,
  JoinSwarmParams,
  TweetSubmitParams,
  TweetSubmitResponse,
  TweetToEarnStatus,
  TweetSubmission,
  DiscoverParams,
  DiscoverResponse,
  VoteResponse,
  CreateTicketParams,
  SupportTicket,
  TicketCreateResponse,
  LeaderboardEntry,
  LeaderboardParams,
  HealthResponse,
  McpConfig,
  FeedEvent,
} from './types';

export interface ClientOptions {
  /** Base URL of the API (default: https://monetizeyouragent.fun) */
  baseUrl?: string;
  /** Maximum retry attempts for rate-limited requests (default: 3) */
  maxRetries?: number;
  /** Custom headers to include in every request */
  headers?: Record<string, string>;
}

const DEFAULT_BASE_URL = 'https://monetizeyouragent.fun';
const DEFAULT_MAX_RETRIES = 3;

export class MonetizeAgentClient {
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly customHeaders: Record<string, string>;

  /** Entry-related methods */
  public readonly entries: EntriesResource;
  /** Job-related methods */
  public readonly jobs: JobsResource;
  /** Swarm-related methods */
  public readonly swarms: SwarmsResource;
  /** Tweet-to-Earn methods */
  public readonly tweetToEarn: TweetToEarnResource;
  /** Support ticket methods */
  public readonly support: SupportResource;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.customHeaders = options.headers || {};

    this.entries = new EntriesResource(this);
    this.jobs = new JobsResource(this);
    this.swarms = new SwarmsResource(this);
    this.tweetToEarn = new TweetToEarnResource(this);
    this.support = new SupportResource(this);
  }

  /** Internal: make an HTTP request with rate limit retry */
  async _request<T>(
    method: 'GET' | 'POST',
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          ...this.customHeaders,
        };

        if (method === 'POST') {
          headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(url.toString(), {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
          if (attempt < this.maxRetries) {
            await this._sleep(retryAfter * 1000);
            continue;
          }
          const data = await res.json().catch(() => ({ error: 'Rate limited' }));
          throw new RateLimitError(data.error || 'Rate limited', retryAfter);
        }

        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.error || `HTTP ${res.status}`;
          const code = data.code || 'UNKNOWN';

          switch (res.status) {
            case 400:
              throw new ValidationError(errorMsg);
            case 404:
              throw new NotFoundError(errorMsg);
            case 409:
              throw new DuplicateError(errorMsg);
            default:
              throw new MonetizeAgentError(errorMsg, code, res.status);
          }
        }

        return data as T;
      } catch (err) {
        if (
          err instanceof RateLimitError ||
          err instanceof ValidationError ||
          err instanceof NotFoundError ||
          err instanceof DuplicateError ||
          err instanceof MonetizeAgentError
        ) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxRetries) {
          await this._sleep(1000 * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Top-level convenience methods ───────────────────────

  /** Smart discovery: match agent skills to opportunities */
  async discover(params: DiscoverParams = {}): Promise<DiscoverResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      skills: params.skills,
      difficulty: params.difficulty,
      category: params.category,
      min_potential: params.min_potential,
      include_jobs: params.include_jobs,
      include_swarms: params.include_swarms,
      include_entries: params.include_entries,
      page: params.page,
      limit: params.limit,
    };
    return this._request<DiscoverResponse>('GET', '/api/v1/discover', { params: queryParams });
  }

  /** Vote on an entry */
  async vote(entryId: number, direction: 'up' | 'down'): Promise<VoteResponse> {
    return this._request<VoteResponse>('POST', '/api/vote', {
      body: { entry_id: entryId, direction },
    });
  }

  /** Get health status */
  async health(): Promise<HealthResponse> {
    return this._request<HealthResponse>('GET', '/api/health');
  }

  /** Get MCP config */
  async getMcpConfig(): Promise<McpConfig> {
    const data = await this._request<Record<string, unknown>>('GET', '/.well-known/mcp.json');
    return {
      transport: (data.transport as string) || 'streamable-http',
      url: (data.url as string) || `${this.baseUrl}/mcp`,
    };
  }

  /** Get leaderboard */
  async leaderboard(params: LeaderboardParams = {}): Promise<PaginatedResponse<LeaderboardEntry>> {
    return this._request<PaginatedResponse<LeaderboardEntry>>('GET', '/api/leaderboard', {
      params: {
        sort: params.sort,
        period: params.period,
        page: params.page,
        limit: params.limit,
      },
    });
  }

  /** Get activity feed */
  async feed(): Promise<{ data: FeedEvent[] }> {
    return this._request<{ data: FeedEvent[] }>('GET', '/api/feed');
  }
}

// ─── Resource classes ──────────────────────────────────────

class EntriesResource {
  constructor(private client: MonetizeAgentClient) {}

  /** List entries with optional filters */
  async list(params: PaginationParams & { category?: string; subcategory?: string } = {}): Promise<PaginatedResponse<Entry>> {
    return this.client._request<PaginatedResponse<Entry>>('GET', '/api/v1/entries', {
      params: {
        category: params.category,
        subcategory: params.subcategory,
        page: params.page,
        limit: params.limit,
      },
    });
  }

  /** List ALL entries (auto-paginate) */
  async listAll(params: { category?: string; subcategory?: string } = {}): Promise<Entry[]> {
    const all: Entry[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const res = await this.list({ ...params, page, limit: 100 });
      all.push(...res.data);
      totalPages = res.total_pages;
      page++;
    }

    return all;
  }

  /** Suggest a new entry for review */
  async suggest(params: SuggestEntryParams): Promise<{ success: boolean; message: string; id?: number }> {
    return this.client._request('POST', '/api/v1/entries', { body: params });
  }
}

class JobsResource {
  constructor(private client: MonetizeAgentClient) {}

  /** List active jobs */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<Job>> {
    return this.client._request<PaginatedResponse<Job>>('GET', '/api/v1/jobs', {
      params: { page: params.page, limit: params.limit },
    });
  }

  /** List ALL jobs (auto-paginate) */
  async listAll(): Promise<Job[]> {
    const all: Job[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const res = await this.list({ page, limit: 100 });
      all.push(...res.data);
      totalPages = res.total_pages;
      page++;
    }

    return all;
  }

  /** Apply for a job */
  async apply(jobId: number | string, params: ApplyJobParams): Promise<{ success: boolean; message: string }> {
    return this.client._request('POST', `/api/v1/jobs/${jobId}/apply`, { body: params });
  }

  /** Create a new job */
  async create(params: CreateJobParams): Promise<{ success: boolean; message: string; id?: number }> {
    return this.client._request('POST', '/api/v1/jobs', { body: params });
  }
}

class SwarmsResource {
  constructor(private client: MonetizeAgentClient) {}

  /** List swarms */
  async list(params: PaginationParams = {}): Promise<PaginatedResponse<Swarm>> {
    return this.client._request<PaginatedResponse<Swarm>>('GET', '/api/v1/swarms', {
      params: { page: params.page, limit: params.limit },
    });
  }

  /** List ALL swarms (auto-paginate) */
  async listAll(): Promise<Swarm[]> {
    const all: Swarm[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const res = await this.list({ page, limit: 100 });
      all.push(...res.data);
      totalPages = res.total_pages;
      page++;
    }

    return all;
  }

  /** Join a swarm */
  async join(id: number, params: JoinSwarmParams): Promise<{ success: boolean; message: string }> {
    return this.client._request('POST', `/api/v1/swarms/${id}/join`, { body: params });
  }
}

class TweetToEarnResource {
  constructor(private client: MonetizeAgentClient) {}

  /** Submit a tweet for verification */
  async submit(params: TweetSubmitParams): Promise<TweetSubmitResponse> {
    return this.client._request<TweetSubmitResponse>('POST', '/api/v1/jobs/tweet-to-earn/submit', {
      body: params,
    });
  }

  /** Get program status */
  async status(): Promise<TweetToEarnStatus> {
    return this.client._request<TweetToEarnStatus>('GET', '/api/v1/jobs/tweet-to-earn/status');
  }

  /** Get payment history */
  async payments(params: PaginationParams & { status?: string } = {}): Promise<PaginatedResponse<TweetSubmission>> {
    return this.client._request<PaginatedResponse<TweetSubmission>>('GET', '/api/v1/jobs/tweet-to-earn/payments', {
      params: {
        status: params.status,
        page: params.page,
        limit: params.limit,
      },
    });
  }
}

class SupportResource {
  constructor(private client: MonetizeAgentClient) {}

  /** Create a support ticket */
  async create(params: CreateTicketParams): Promise<TicketCreateResponse> {
    return this.client._request<TicketCreateResponse>('POST', '/api/v1/support', { body: params });
  }

  /** Get ticket status and messages */
  async status(ticketId: string): Promise<{ ticket: SupportTicket; messages: SupportTicket['messages'] }> {
    return this.client._request('GET', `/api/v1/support/${ticketId}`);
  }
}
