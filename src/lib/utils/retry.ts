export class RetryableOperationError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = "RetryableOperationError";
    this.retryable = retryable;
  }
}

type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < options.maxAttempts &&
        (options.shouldRetry ? options.shouldRetry(error) : error instanceof RetryableOperationError);

      if (!canRetry) {
        break;
      }

      const exponentialDelay = Math.min(
        options.baseDelayMs * 2 ** (attempt - 1),
        options.maxDelayMs,
      );
      const jitter = Math.floor(Math.random() * 100);
      await sleep(exponentialDelay + jitter);
    }
  }

  throw lastError;
}
