const DEFAULT_TIMEOUT_MS = 12_000;

export class RequestTimeoutError extends Error {
  readonly code = 'app/timeout';

  constructor(message = 'This is taking too long — check your connection and try again.') {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Keeps form actions from leaving a person on a permanent loading state when a
 * remote SDK call cannot reach its service. The underlying request may still
 * finish later, so callers should treat a timeout as an unknown result.
 */
export function withTimeout<T>(operation: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestTimeoutError()), timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
