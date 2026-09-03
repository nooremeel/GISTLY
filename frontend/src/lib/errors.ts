/**
 * Narrows an unknown catch binding to the apiClient's `.status` number.
 * The apiClient throws a plain `Error` with a `.status` property attached —
 * but it's untyped JS, so under `strict`'s `useUnknownInCatchVariables`
 * the catch binding is `unknown`. This helper narrows it safely.
 */
export function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

/**
 * Extracts a human-readable message from an unknown catch binding,
 * falling back to the provided `fallback` string if the error has no
 * `.message` (e.g. a non-Error throw, a network failure, etc).
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
