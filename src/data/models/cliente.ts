/**
 * Modelo del cliente para el flujo de venta.
 *
 * `GET /api/ventas/buscar-cliente?q=...` devuelve clientes de
 * `seguridad.personas` (`es_cliente = TRUE`) buscando por teléfono,
 * nombre o email.
 */
export interface ClienteBusqueda {
  id: number;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  rfc: string | null;
}

/** Nombre a mostrar (fallback por si viene vacío). */
export function nombreCliente(c: ClienteBusqueda): string {
  const n = (c.nombre ?? '').trim();
  return n.length > 0 ? n : 'Cliente sin nombre';
}

/** Línea secundaria: teléfono · email (vacíos se omiten). */
export function contactoCliente(c: ClienteBusqueda): string {
  const partes = [c.telefono?.trim(), c.email?.trim()].filter(
    (p): p is string => Boolean(p && p.length > 0),
  );
  return partes.join(' · ');
}
