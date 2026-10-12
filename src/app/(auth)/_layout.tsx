import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

/**
 * Grupo de rutas PÚBLICAS (login, registro, recuperación).
 * Si ya hay sesión, no tiene sentido mostrar auth: de vuelta al catálogo.
 * (En la Fase C, el acceso a Perfil ya enviará aquí cuando no haya sesión.)
 */
export default function AuthLayout() {
  const { isRestoring, isAuthenticated } = useAuth();

  if (isRestoring) return null;
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
