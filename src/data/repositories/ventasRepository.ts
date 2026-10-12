import { http } from '@/config/http';
import type { ClienteBusqueda } from '@/data/models/cliente';
import type { VarianteBusqueda } from '@/data/models/venta';

/**
 * Repo de los endpoints POS (`/api/ventas/*`).
 * Todos requieren JWT con rol `rol_admin` o `rol_vendedor` — se envía
 * automáticamente desde `AuthContext` vía `setAuthToken`.
 *
 * `signal` permite cancelar peticiones obsoletas desde el ViewModel
 * (debounce / consultas en cadena).
 */
export const ventasRepository = {
  /** Busca variantes por nombre de producto o SKU (hasta 40 resultados). */
  buscarProducto(q: string, signal?: AbortSignal): Promise<VarianteBusqueda[]> {
    const query = encodeURIComponent(q);
    return http.get<VarianteBusqueda[]>(`/ventas/buscar-producto?q=${query}`, { signal });
  },

  /** Busca clientes por teléfono, nombre o email (hasta 10 resultados). */
  buscarCliente(q: string, signal?: AbortSignal): Promise<ClienteBusqueda[]> {
    const query = encodeURIComponent(q);
    return http.get<ClienteBusqueda[]>(`/ventas/buscar-cliente?q=${query}`, { signal });
  },
};
