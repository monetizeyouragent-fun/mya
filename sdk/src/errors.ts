/** Base error for all SDK errors */
export class MonetizeAgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'MonetizeAgentError';
  }
}

/** Thrown when rate limited (429) */
export class RateLimitError extends MonetizeAgentError {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

/** Thrown on validation errors (400) */
export class ValidationError extends MonetizeAgentError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/** Thrown when resource not found (404) */
export class NotFoundError extends MonetizeAgentError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/** Thrown on duplicate operations (409) */
export class DuplicateError extends MonetizeAgentError {
  constructor(message: string) {
    super(message, 'DUPLICATE', 409);
    this.name = 'DuplicateError';
  }
}
