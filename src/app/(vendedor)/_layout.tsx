import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { ROLES, type UserRole } from '@/data/models/user';
import { VentaEnCursoProvider } from '@/features/ventas/context/VentaEnCursoContext';

/** Roles que pueden entrar al módulo del vendedor (POS). */
const ROLES_PERMITIDOS: readonly UserRole[] = [ROLES.vendedor, ROLES.admin];

/**
 * Grupo de rutas del VENDEDOR (POS: punto de venta y búsquedas rápidas).
 *
 * Guardia:
 * - sin sesión → `/sign-in`
 * - rol sin permiso → `/` (catálogo público)
 *
 * El Provider de venta en curso vive aquí: así las pantallas de búsqueda y
 * la del POS comparten el mismo estado mientras el vendedor está en el grupo.
 */
export default function VendedorLayout() {
  const { isRestoring, isAuthenticated, role } = useAuth();

  if (isRestoring) return null;
  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  if (!role || !ROLES_PERMITIDOS.includes(role)) return <Redirect href="/" />;

  return (
    <VentaEnCursoProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </VentaEnCursoProvider>
  );
}
