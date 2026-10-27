import { http } from '@/config/http';
import type {
  AbonoRequest,
  AbonoResponse,
  ApartadoDetalle,
  ApartadoResumen,
  CrearApartadoRequest,
  CrearApartadoResponse,
  FiltroApartado,
} from '@/data/models/apartado';

/**
 * Repo de Apartados (`/api/ventas/apartados*`). Requieren JWT con rol
 * `rol_admin` o `rol_vendedor` (se envía solo desde `AuthContext`).
 *
 * Las escrituras no reciben `signal` a propósito: una operación de dinero ya
 * enviada no debe cancelarse a medio camino desde el cliente.
 */
export const apartadosRepository = {
  /** Lista por estado ('vencido' es derivado) y búsqueda por folio/nombre/teléfono. */
  listar(filtro: FiltroApartado, q: string, signal?: AbortSignal): Promise<ApartadoResumen[]> {
    const params: string[] = [];
    if (filtro !== 'todos') params.push(`estado=${encodeURIComponent(filtro)}`);
    const query = q.trim();
    if (query.length > 0) params.push(`q=${encodeURIComponent(query)}`);
    const qs = params.length > 0 ? `?${params.join('&')}` : '';
    return http.get<ApartadoResumen[]>(`/ventas/apartados${qs}`, { signal });
  },

  /** Cabecera + artículos + historial de abonos. */
  detalle(id: number, signal?: AbortSignal): Promise<ApartadoDetalle> {
    return http.get<ApartadoDetalle>(`/ventas/apartados/${id}`, { signal });
  },

  /** Crea el apartado, reserva stock y registra el anticipo (si hay). */
  crear(payload: CrearApartadoRequest): Promise<CrearApartadoResponse> {
    return http.post<CrearApartadoResponse>('/ventas/apartados', payload);
  },

  /** Registra un abono. Si cubre el saldo, el backend liquida y entrega. */
  abonar(id: number, payload: AbonoRequest): Promise<AbonoResponse> {
    return http.post<AbonoResponse>(`/ventas/apartados/${id}/abonos`, payload);
  },

  /** Cancela un apartado activo y libera el stock reservado. */
  cancelar(id: number): Promise<{ message: string }> {
    return http.post<{ message: string }>(`/ventas/apartados/${id}/cancelar`);
  },
};
