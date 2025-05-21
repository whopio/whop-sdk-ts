class RetryError extends Error {
  constructor(
    message: string,
    public readonly errors: unknown[],
    public readonly maxRetries: number
  ) {
    super(message);
    this.name = "RetryError";
  }
}

// biome-ignore lint/suspicious/noExplicitAny: required for type inference
export async function retry<Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
  maxRetries: number,
  signal?: AbortSignal,
  ...args: Parameters<Fn>
): Promise<Awaited<ReturnType<Fn>>> {
  let tries = 0;
  const errors: unknown[] = [];
  while (tries < maxRetries) {
    signal?.throwIfAborted();
    try {
      const res = await fn(...args);
      return res;
    } catch (error) {
      errors.push(error);
      tries++;
    }
  }
  throw new RetryError("Failed to retry", errors, maxRetries);
}
