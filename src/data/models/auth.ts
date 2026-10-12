/** DTOs de los endpoints de autenticación (`/api/users/...`). */

/** Usuario tal como lo devuelve el backend en login / force-password-change. */
export interface UsuarioDTO {
  id: number | string;
  email: string;
  rol?: string;
  nombre?: string;
}

export interface LoginResponse {
  message: string;
  requirePasswordChange: boolean;
  token: string;
  usuario: UsuarioDTO;
}

export interface ForcePasswordChangeResponse {
  message: string;
  token: string;
  usuario: UsuarioDTO;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  /** Opcional en el backend (10 dígitos si se envía). */
  telefono_contacto?: string;
  /** Obligatorio en el registro web. Formato ISO `YYYY-MM-DD`. */
  fecha_nacimiento: string;
}

/** Respuesta genérica `{ message }` (registro, recuperación, etc.). */
export interface MessageResponse {
  message: string;
}
