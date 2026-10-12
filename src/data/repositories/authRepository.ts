import { http } from '@/config/http';
import type {
  ForcePasswordChangeResponse,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  UsuarioDTO,
} from '@/data/models/auth';
import type { Session } from '@/data/models/session';
import type { User, UserRole } from '@/data/models/user';

function toUser(dto: UsuarioDTO): User {
  return {
    id: dto.id,
    email: dto.email,
    nombre: dto.nombre,
    rol: (dto.rol ?? 'rol_cliente') as UserRole,
  };
}

export interface LoginResult {
  /** El backend exige definir una contraseña nueva (empleado con clave temporal). */
  requirePasswordChange: boolean;
  /** Token (definitivo, o temporal de 15 min si `requirePasswordChange`). */
  token: string;
  user: User;
  message: string;
}

/**
 * Acceso a los endpoints de autenticación. Es la única capa que conoce las
 * rutas y el shape del backend; los viewmodels hablan en términos de dominio.
 */
export const authRepository = {
  async login(email: string, password: string): Promise<LoginResult> {
    const res = await http.post<LoginResponse>(
      '/users/login',
      { email, password },
      { auth: false },
    );
    return {
      requirePasswordChange: res.requirePasswordChange,
      token: res.token,
      user: toUser(res.usuario),
      message: res.message,
    };
  },

  async forcePasswordChange(nuevaPassword: string, tempToken: string): Promise<Session> {
    const res = await http.post<ForcePasswordChangeResponse>(
      '/users/force-password-change',
      { nueva_password: nuevaPassword },
      { token: tempToken },
    );
    return { token: res.token, user: toUser(res.usuario) };
  },

  register(payload: RegisterRequest): Promise<MessageResponse> {
    return http.post<MessageResponse>('/users/register', payload, { auth: false });
  },

  recoverSendEmail(email: string): Promise<MessageResponse> {
    return http.post<MessageResponse>('/users/recover/send-email', { email }, { auth: false });
  },

  recoverValidateToken(token: string): Promise<MessageResponse> {
    return http.post<MessageResponse>('/users/recover/validate-token', { token }, { auth: false });
  },

  recoverReset(token: string, nuevaPassword: string): Promise<MessageResponse> {
    return http.post<MessageResponse>(
      '/users/recover/reset',
      { token, nueva_password: nuevaPassword },
      { auth: false },
    );
  },
};
