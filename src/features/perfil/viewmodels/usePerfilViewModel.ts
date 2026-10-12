import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/config/http';
import { useAuth } from '@/context/AuthContext';
import { userRepository, type PerfilResponse } from '@/data/repositories/userRepository';

/**
 * Lógica de la pantalla de Perfil.
 *
 * Muestra de inmediato los datos que ya trae el AuthContext (nombre, correo,
 * rol) y los enriquece con el teléfono que devuelve `GET /users/profile`.
 * Si ese fetch recibe 401/403 (sesión vencida), el handler global del cliente
 * HTTP cierra la sesión y el guard de la ruta manda a Iniciar sesión.
 */
export function usePerfilViewModel() {
  const { user, signOut } = useAuth();

  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback((signal?: AbortSignal) => userRepository.getProfile(signal), []);

  const aplicar = useCallback((p: PerfilResponse) => {
    setPerfil(p);
    setError(null);
  }, []);

  const fallar = useCallback((e: unknown) => {
    if ((e as { name?: string })?.name === 'AbortError') return;
    // 401/403 lo resuelve el auto-logout global; aquí solo mostramos otros errores.
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return;
    setError(e instanceof ApiError ? e.message : 'No se pudo cargar tu perfil.');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal)
      .then(aplicar)
      .catch(fallar)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchProfile, aplicar, fallar]);

  const recargar = useCallback(() => {
    setLoading(true);
    fetchProfile()
      .then(aplicar)
      .catch(fallar)
      .finally(() => setLoading(false));
  }, [fetchProfile, aplicar, fallar]);

  const cerrarSesion = useCallback(async () => {
    // Primero al catálogo público, luego limpiamos (evita el flash del guard a login).
    router.replace('/');
    await signOut();
  }, [signOut]);

  return {
    loading,
    error,
    recargar,
    cerrarSesion,
    rol: user?.rol ?? null,
    nombre: perfil?.nombre ?? user?.nombre ?? 'Usuario',
    email: perfil?.email ?? user?.email ?? '',
    telefono: perfil?.telefono_contacto ?? user?.telefono_contacto ?? null,
  };
}
