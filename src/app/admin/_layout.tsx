import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/data/models/user';

/**
 * Rutas del ADMINISTRADOR (`/admin/*`).
 *
 * Guardia:
 * - sin sesión → `/sign-in`
 * - rol distinto de `rol_admin` → `/` (catálogo público)
 *
 * Por ahora solo entra `rol_admin`: el Inicio consulta ventas y caja, que el
 * backend no permite al gestor de inventario, y un 403 cierra la sesión
 * (handler global de `http`). El acceso del gestor se resolverá con el
 * acceso por rol.
 */
export default function AdminLayout() {
  const { isRestoring, isAuthenticated, role } = useAuth();

  if (isRestoring) return null;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  if (role !== ROLES.admin) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
