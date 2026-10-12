/**
 * Configuración de entorno de la app.
 *
 * El backend es el MISMO que consume la web (`proyecto-usuarios`), desplegado
 * en Render. Por defecto apuntamos a producción para que la app funcione en un
 * dispositivo físico sin configuración extra. Para desarrollo local, define
 * `EXPO_PUBLIC_API_URL` en `.env` apuntando a la IP LAN de tu máquina, p. ej.:
 *
 *   EXPO_PUBLIC_API_URL=http://192.168.1.50:4000/api
 *
 * (En un teléfono físico `localhost` apunta al propio teléfono, no a tu PC.)
 */
const FALLBACK_API_URL = 'https://modulo-usuarios-docker.onrender.com/api';

const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

/** URL base de la API, sin barra final. */
export const API_BASE_URL = (fromEnv && fromEnv.length > 0 ? fromEnv : FALLBACK_API_URL).replace(/\/+$/, '');

/**
 * Tiempo máximo por petición. El plan gratuito de Render puede tardar en
 * "despertar" (cold start), por eso es holgado.
 */
export const REQUEST_TIMEOUT_MS = 30000;
