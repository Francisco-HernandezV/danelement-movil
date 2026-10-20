import { http } from '@/config/http';
import type { ClienteBusqueda } from '@/data/models/cliente';
import type {
  ProcesarVentaRequest,
  ProcesarVentaResponse,
  VarianteBusqueda,
} from '@/data/models/venta';

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

  /**
   * Registra (cobra) la venta: descuenta stock y guarda TODOS los pagos
   * (`payload.pagos`, uno o varios combinados) en una sola transacción del
   * backend. Requiere caja abierta. Sin `signal` a propósito:
   * una venta enviada no debe cancelarse desde el cliente a medio camino.
   */
  procesarVenta(payload: ProcesarVentaRequest): Promise<ProcesarVentaResponse> {
    return http.post<ProcesarVentaResponse>('/ventas/procesar', payload);
  },
};
