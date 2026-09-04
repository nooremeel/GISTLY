const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || '';
const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '');

function buildUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanPath = path.trim().replace(/^\/+/, '/');
  return `${cleanBase}${cleanPath}`;
}

/** Error shape thrown by `request` — includes the HTTP status code. */
export interface ApiError extends Error {
  status: number;
}

/**
 * Core fetch wrapper. All API calls go through this so credentials,
 * Content-Type, and error normalisation are applied consistently.
 *
 * Throws an `ApiError` (with `.status`) on non-2xx responses so callers
 * can distinguish 401 / 404 / 429 etc from network errors.
 */
async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for non-FormData bodies — the browser sets the
  // correct multipart boundary automatically for FormData.
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = buildUrl(API_BASE_URL, path);
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // No JSON body (e.g. 204 No Content) — body stays null.
  }

  if (!res.ok) {
    const err = new Error(
      (body as { message?: string })?.message ?? res.statusText
    ) as ApiError;
    err.status = res.status;
    throw err;
  }

  return body as T;
}

export const apiClient = {
  get: <T = unknown>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  postFormData: <T = unknown>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),

  put: <T = unknown>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

/**
 * Resolves a bookmark image path to a fully-qualified URL.
 * - Already-absolute URLs are returned unchanged.
 * - Relative paths (e.g. from local uploads) are prefixed with API_BASE_URL.
 */
export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return buildUrl(API_BASE_URL, path);
};
