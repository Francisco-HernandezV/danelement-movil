import type { User } from './user';

/** Sesión activa: el JWT y el usuario al que pertenece. */
export interface Session {
  token: string;
  user: User;
}
