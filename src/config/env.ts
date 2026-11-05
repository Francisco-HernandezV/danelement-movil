const FALLBACK_API_URL = 'https://modulo-usuarios-docker.onrender.com/api';

const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (fromEnv && fromEnv.length > 0 ? fromEnv : FALLBACK_API_URL).replace(/\/+$/, '');

export const REQUEST_TIMEOUT_MS = 30000;

/**
 * Sitio web público. Ahí viven los Términos y condiciones (/terminos) y el
 * Aviso de privacidad (/privacidad) que la app abre en el navegador.
 */
const FALLBACK_WEB_URL = 'https://modulo-usuarios.vercel.app';
const webFromEnv = process.env.EXPO_PUBLIC_WEB_URL?.trim();
export const WEB_BASE_URL = (webFromEnv && webFromEnv.length > 0 ? webFromEnv : FALLBACK_WEB_URL).replace(/\/+$/, '');

export const LEGAL_URLS = {
  terminos: `${WEB_BASE_URL}/terminos`,
  privacidad: `${WEB_BASE_URL}/privacidad`,
} as const;
