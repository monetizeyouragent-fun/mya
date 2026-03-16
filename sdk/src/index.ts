export { MonetizeAgentClient } from './client';
export type { ClientOptions } from './client';

export {
  MonetizeAgentError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  DuplicateError,
} from './errors';

export type {
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
  DiscoverResult,
  DiscoverResponse,
  VoteResponse,
  CreateTicketParams,
  SupportTicket,
  TicketMessage,
  TicketCreateResponse,
  LeaderboardEntry,
  LeaderboardParams,
  HealthResponse,
  McpConfig,
  FeedEvent,
} from './types';
