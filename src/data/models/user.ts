/** Roles tal cual los emite el backend (`usuario.rol`). */
export type UserRole = 'rol_admin' | 'rol_vendedor' | 'rol_gestor_inventario' | 'rol_cliente';

export const ROLES = {
  admin: 'rol_admin',
  vendedor: 'rol_vendedor',
  gestor: 'rol_gestor_inventario',
  cliente: 'rol_cliente',
} as const satisfies Record<string, UserRole>;

/** Usuario autenticado (lo mínimo que la app necesita en sesión). */
export interface User {
  id: number | string;
  email: string;
  nombre?: string;
  rol: UserRole;
  telefono_contacto?: string | null;
}

/** Etiqueta legible del rol para la UI. */
export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'rol_admin':
      return 'Administrador';
    case 'rol_vendedor':
      return 'Vendedor';
    case 'rol_gestor_inventario':
      return 'Gestor de inventario';
    default:
      return 'Cliente';
  }
}
