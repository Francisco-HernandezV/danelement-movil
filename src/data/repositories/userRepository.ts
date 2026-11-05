import { http } from '@/config/http';

/** Perfil del usuario autenticado (`GET /users/profile`). */
export interface PerfilResponse {
  id: number | string;
  nombre: string;
  email: string;
  telefono_contacto: string | null;
}

export interface EliminarCuentaResponse {
  message: string;
  /** Fecha ISO en que se borrarán los datos personales. */
  anonimizacion_programada: string;
}

export const userRepository = {
  /** Datos del perfil (requiere sesión). */
  getProfile(signal?: AbortSignal): Promise<PerfilResponse> {
    return http.get<PerfilResponse>('/users/profile', { signal });
  },

  /**
   * Elimina la cuenta del cliente: se desactiva de inmediato y sus datos se
   * borran a los 30 días. Si inicia sesión antes, se cancela.
   */
  eliminarCuenta(password: string): Promise<EliminarCuentaResponse> {
    return http.post<EliminarCuentaResponse>('/users/eliminar-cuenta', { password });
  },
};
