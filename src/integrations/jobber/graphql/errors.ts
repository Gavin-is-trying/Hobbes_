export class JobberError extends Error { constructor(message: string, readonly details?: Record<string, unknown>) { super(message); this.name = new.target.name; } }
export class JobberAuthenticationError extends JobberError {}
export class JobberRateLimitError extends JobberError { constructor(message: string, readonly retryAfterMs: number) { super(message, { retryAfterMs }); } }
export class JobberGraphQLError extends JobberError {}
export class JobberNetworkError extends JobberError {}
export class JobberValidationError extends JobberError {}
