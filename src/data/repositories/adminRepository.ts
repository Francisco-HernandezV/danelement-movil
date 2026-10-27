import { http } from '@/config/http';
import type {
  ApartadoVencido,
  EstadoCaja,
  ReporteVentas,
  VarianteInventario,
} from '@/data/models/admin';

/**
 * Repo del módulo de Administrador. Todos requieren JWT; los roles permitidos
 * de cada endpoint están en `data/models/admin.ts`.
 */
export const adminRepository = {
  /** Reporte de ventas en un rango (fechas `YYYY-MM-DD`, ambas incluidas). */
  reporteVentas(
    rango: { inicio: string; fin: string },
    signal?: AbortSignal,
  ): Promise<ReporteVentas> {
    const qs = `fecha_inicio=${encodeURIComponent(rango.inicio)}&fecha_fin=${encodeURIComponent(rango.fin)}`;
    return http.get<ReporteVentas>(`/admin/reportes/ventas?${qs}`, { signal });
  },

  /** Todas las variantes con su stock. */
  inventario(signal?: AbortSignal): Promise<VarianteInventario[]> {
    return http.get<VarianteInventario[]>('/admin/inventario', { signal });
  },

  /** Si hay un turno de caja abierto. */
  estadoCaja(signal?: AbortSignal): Promise<EstadoCaja> {
    return http.get<EstadoCaja>('/ventas/caja/estado', { signal });
  },

  /** Apartados activos con fecha límite vencida. */
  apartadosVencidos(signal?: AbortSignal): Promise<ApartadoVencido[]> {
    return http.get<ApartadoVencido[]>('/ventas/apartados/vencidos', { signal });
  },
};
