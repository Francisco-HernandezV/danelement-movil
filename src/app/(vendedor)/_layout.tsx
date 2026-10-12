import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { ROLES, type UserRole } from '@/data/models/user';

/** Roles que pueden entrar al módulo del vendedor (POS). */
const ROLES_PERMITIDOS: readonly UserRole[] = [ROLES.vendedor, ROLES.admin];

/**
 * Grupo de rutas del VENDEDOR (POS: búsquedas rápidas y venta en curso).
 *
 * Guardia:
 * - sin sesión → `/sign-in`
 * - rol sin permiso → `/` (catálogo público)
 */
export default function VendedorLayout() {
  const { isRestoring, isAuthenticated, role } = useAuth();

  if (isRestoring) return null;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  if (!role || !ROLES_PERMITIDOS.includes(role)) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
