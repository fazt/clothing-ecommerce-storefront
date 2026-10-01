/** A failure caused by how the CLI was used; `hint` says how to fix it. */
export class CliError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
  }
}

/** A non-2xx response from the API. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown,
  ) {
    super(message);
  }

  /** Per-field messages sent by the API's Zod validation (400). */
  get details(): { path: string; message: string }[] {
    const details = (this.body as { details?: unknown } | undefined)?.details;
    return Array.isArray(details) ? details : [];
  }
}
