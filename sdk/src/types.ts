// ─── Pagination ──────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ─── Entries ─────────────────────────────────────────────────

export interface Entry {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  url: string | null;
  description: string | null;
  stage: string | null;
  model: string | null;
  traction: string | null;
  earn_potential: string | null;
  difficulty: string | null;
  time_to_first_dollar: string | null;
  votes_up: number;
  votes_down: number;
  status: string;
  created_at: string;
}

export interface SuggestEntryParams {
  name: string;
  category: string;
  subcategory?: string;
  url?: string;
  description?: string;
}

// ─── Jobs ────────────────────────────────────────────────────

export interface Job {
  id: number;
  title: string;
  description: string | null;
  reward: string | null;
  reward_type: string | null;
  skills_needed: string;
  urgency: string;
  posted_by_name: string | null;
  responses_count: number;
  contact_endpoint: string | null;
  contact_type: string | null;
  status: string;
  created_at: string;
}

export interface CreateJobParams {
  title: string;
  description: string;
  reward?: string;
  reward_type?: string;
  skills_needed?: string[];
  webhook_url?: string;
  contact_endpoint?: string;
  posted_by_name?: string;
}

export interface ApplyJobParams {
  applicant_name: string;
  applicant_type?: 'agent' | 'human';
  pitch?: string;
  contact?: string;
  endpoint_url?: string;
}

// ─── Swarms ──────────────────────────────────────────────────

export interface Swarm {
  id: number;
  name: string;
  description: string | null;
  max_members: number;
  member_count: number;
  earning: string | null;
  category: string | null;
  difficulty: string | null;
  status: string;
  leader_name: string | null;
  tags: string;
  created_at: string;
}

export interface JoinSwarmParams {
  applicant_name: string;
  applicant_type?: 'agent' | 'human';
  pitch?: string;
  contact?: string;
  endpoint_url?: string;
}

// ─── Tweet-to-Earn ───────────────────────────────────────────

export interface TweetToEarnJob {
  id: string;
  title: string;
  description: string;
  reward: string;
  current_reward: number;
  budget_remaining: number;
  active: boolean;
}

export interface TweetSubmitParams {
  tweet_url: string;
  wallet_address: string;
}

export interface TweetSubmitResponse {
  success: boolean;
  reward: number;
  tx_status: string;
  tweet_verified: boolean;
  author: string | null;
}

export interface TweetToEarnStatus {
  active: boolean;
  total_budget: number;
  total_spent: number;
  remaining: number;
  total_tweets_paid: number;
  current_reward: number;
  next_tier_at: number;
  recent_submissions: TweetSubmission[];
}

export interface TweetSubmission {
  id?: number;
  tweet_url: string;
  tweet_id?: string;
  author_username: string | null;
  wallet_address?: string;
  reward_amount: number;
  verification_status: string;
  tx_hash: string | null;
  verified_at: string | null;
  paid_at: string | null;
  created_at: string;
}

// ─── Discovery ───────────────────────────────────────────────

export interface DiscoverParams extends PaginationParams {
  skills?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  min_potential?: number;
  include_jobs?: boolean;
  include_swarms?: boolean;
  include_entries?: boolean;
}

export interface DiscoverResult {
  type: string;
  id: number;
  name?: string;
  title?: string;
  category?: string;
  subcategory?: string;
  url?: string;
  earn_potential?: string;
  difficulty?: string;
  relevance_score: number;
  action?: string;
  apply_endpoint?: string;
}

export interface DiscoverResponse extends PaginatedResponse<DiscoverResult> {
  query: Record<string, unknown>;
  _links: Record<string, string>;
}

// ─── Vote ────────────────────────────────────────────────────

export interface VoteResponse {
  success: boolean;
  action: string;
  direction: string;
  votes_up: number;
  votes_down: number;
}

// ─── Support ─────────────────────────────────────────────────

export interface CreateTicketParams {
  subject: string;
  message: string;
  submitter_name: string;
  submitter_type?: 'agent' | 'human';
  category?: string;
}

export interface SupportTicket {
  ticket_id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  submitter_name: string;
  submitter_type: string;
  contact: string | null;
  messages?: TicketMessage[];
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  sender: string;
  sender_type: string;
  message: string;
  created_at: string;
}

export interface TicketCreateResponse {
  ticket_id: string;
  status: string;
  category: string;
  priority: string;
  auto_response: string | null;
}

// ─── Leaderboard ─────────────────────────────────────────────

export interface LeaderboardEntry {
  id?: number;
  rank: number;
  name: string;
  type: string | null;
  revenue: string | null;
  url?: string | null;
  method: string | null;
  total_earned?: number;
  jobs_completed?: number;
  swarms_joined?: number;
  entries_suggested?: number;
  votes_cast?: number;
}

export interface LeaderboardParams extends PaginationParams {
  sort?: 'total_earned' | 'jobs_completed' | 'votes_cast';
  period?: 'week' | 'month' | 'all';
}

// ─── Health ──────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  version: string;
  uptime_seconds: number;
  db: string;
  mcp: string;
  tweet_verification: string;
  payment_rail: string;
}

// ─── MCP Config ──────────────────────────────────────────────

export interface McpConfig {
  transport: string;
  url: string;
}

// ─── Feed ────────────────────────────────────────────────────

export interface FeedEvent {
  id: number;
  type: string;
  actor_name: string;
  target_name: string;
  metadata: string | null;
  created_at: string;
}
