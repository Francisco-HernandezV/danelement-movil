import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './env';

/**
 * Cliente HTTP ligero sobre `fetch` (sin dependencias extra).
 *
 * Consume la misma API que la web. El backend devuelve el JWT en el *body* de
 * la respuesta de login; aquí lo inyectamos como `Authorization: Bearer <token>`
 * en cada petición. El token lo administra el AuthContext vía `setAuthToken`.
 */

let authToken: string | null = null;

/** Lo llama el AuthContext al iniciar sesión, restaurar o cerrar sesión. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Handler que se dispara cuando una petición hecha CON el token de sesión recibe
 * 401/403 (sesión vencida o revocada). El AuthContext lo usa para cerrar sesión
 * automáticamente. No se dispara en llamadas públicas (login, catálogo) ni con
 * un token puntual (p. ej. el temporal de cambio de contraseña).
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/** Error normalizado de la API. */
export class ApiError extends Error {
  /** Código HTTP (0 = error de red / timeout). */
  readonly status: number;
  /** Errores por campo provenientes de `errors: [{ path, msg }]`. */
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  /** Forzar/omitir el header Authorization. Por defecto se usa el token global. */
  auth?: boolean;
  /** Token puntual (p. ej. el token temporal de "cambio de contraseña"). */
  token?: string;
  /** Señal para cancelar desde el llamador (p. ej. al desmontar una pantalla). */
  signal?: AbortSignal;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function defaultMessageFor(status: number): string {
  if (status === 0) return 'No se pudo conectar con el servidor.';
  if (status >= 500) return 'Error del servidor. Inténtalo de nuevo más tarde.';
  if (status === 401 || status === 403) return 'No autorizado.';
  return 'Ocurrió un error al procesar la solicitud.';
}

function toApiError(status: number, data: unknown): ApiError {
  const body = (data ?? {}) as { message?: unknown; errors?: unknown };
  const message = typeof body.message === 'string' ? body.message : defaultMessageFor(status);

  let fieldErrors: Record<string, string> | undefined;
  if (Array.isArray(body.errors)) {
    fieldErrors = {};
    for (const entry of body.errors as { path?: string; param?: string; msg?: string }[]) {
      const key = entry?.path ?? entry?.param;
      if (key && typeof entry?.msg === 'string') fieldErrors[key] = entry.msg;
    }
  }
  return new ApiError(message, status, fieldErrors);
}

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (options?.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort());
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const effectiveToken = options?.token ?? (options?.auth === false ? null : authToken);
  if (effectiveToken) headers.Authorization = `Bearer ${effectiveToken}`;

  // ¿Esta petición usó el token de sesión global? (para el auto-logout en 401/403)
  const usedSessionToken =
    options?.token === undefined && options?.auth !== false && authToken !== null;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error)?.name === 'AbortError') {
      throw new ApiError('La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.', 0);
    }
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión a internet.', 0);
  }
  clearTimeout(timeoutId);

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && usedSessionToken) {
      onUnauthorized?.();
    }
    throw toApiError(response.status, data);
  }
  return data as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};
