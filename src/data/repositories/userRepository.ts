import { http } from '@/config/http';

/** Perfil del usuario autenticado (`GET /users/profile`). */
export interface PerfilResponse {
  id: number | string;
  nombre: string;
  email: string;
  telefono_contacto: string | null;
}

export const userRepository = {
  /** Datos del perfil (requiere sesión). */
  getProfile(signal?: AbortSignal): Promise<PerfilResponse> {
    return http.get<PerfilResponse>('/users/profile', { signal });
  },
};
