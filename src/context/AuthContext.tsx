import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { http, setAuthToken, setUnauthorizedHandler } from '@/config/http';
import * as storage from '@/config/storage';
import type { Session } from '@/data/models/session';
import type { User, UserRole } from '@/data/models/user';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthContextValue {
  /** Usuario en sesión, o `null` si no hay. */
  user: User | null;
  /** JWT actual, o `null`. */
  token: string | null;
  /** Rol del usuario en sesión, o `null`. */
  role: UserRole | null;
  /** `true` si hay token + usuario. */
  isAuthenticated: boolean;
  /** `true` mientras se restaura la sesión desde el almacenamiento (arranque). */
  isRestoring: boolean;
  /** Guarda la sesión (token + usuario) en estado y almacenamiento seguro. */
  signIn: (session: Session) => Promise<void>;
  /** Cierra sesión: invalida el token en el backend (best-effort) y limpia todo. */
  signOut: () => Promise<void>;
  /** Actualiza datos del usuario en sesión (p. ej. tras editar el perfil). */
  updateUser: (patch: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restaurar sesión persistida al arrancar.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(USER_KEY),
        ]);
        if (active && storedToken && storedUser) {
          const parsed = JSON.parse(storedUser) as User;
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(parsed);
        }
      } catch (error) {
        console.warn('[auth] no se pudo restaurar la sesión:', error);
      } finally {
        if (active) setIsRestoring(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (session: Session) => {
    setAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
    await Promise.all([
      storage.setItem(TOKEN_KEY, session.token),
      storage.setItem(USER_KEY, JSON.stringify(session.user)),
    ]);
  }, []);

  /** Limpia la sesión localmente (sin llamar al backend). */
  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(USER_KEY)]);
  }, []);

  const signOut = useCallback(async () => {
    // Best-effort: el backend sube `token_version` para invalidar el JWT.
    try {
      await http.post('/users/logout');
    } catch {
      // Sin red o token ya inválido: cerramos sesión localmente de todas formas.
    }
    await clearSession();
  }, [clearSession]);

  // Auto-logout: si una petición con el token de sesión recibe 401/403
  // (sesión vencida/revocada), limpiamos la sesión localmente.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const updateUser = useCallback(async (patch: Partial<User>) => {
    let nextUser: User | null = null;
    setUser((prev) => {
      nextUser = prev ? { ...prev, ...patch } : prev;
      return nextUser;
    });
    if (nextUser) {
      await storage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role: user?.rol ?? null,
      isAuthenticated: Boolean(token && user),
      isRestoring,
      signIn,
      signOut,
      updateUser,
    }),
    [user, token, isRestoring, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
