const FALLBACK_API_URL = 'https://modulo-usuarios-docker.onrender.com/api';

const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (fromEnv && fromEnv.length > 0 ? fromEnv : FALLBACK_API_URL).replace(/\/+$/, '');

export const REQUEST_TIMEOUT_MS = 30000;
