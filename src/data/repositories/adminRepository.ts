import { http } from '@/config/http';
import type {
  ApartadoVencido,
  CategoriaAdmin,
  EstadoCaja,
  ReporteVentas,
  VarianteInventario,
  VentaHistorial,
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
    categoriaId?: number | null,
  ): Promise<ReporteVentas> {
    let qs = `fecha_inicio=${encodeURIComponent(rango.inicio)}&fecha_fin=${encodeURIComponent(rango.fin)}`;
    if (categoriaId != null) qs += `&categoria_id=${encodeURIComponent(String(categoriaId))}`;
    return http.get<ReporteVentas>(`/admin/reportes/ventas?${qs}`, { signal });
  },

  /** Categorías del catálogo (para filtrar el reporte). */
  categorias(signal?: AbortSignal): Promise<CategoriaAdmin[]> {
    return http.get<CategoriaAdmin[]>('/admin/categorias', { signal, auth: false });
  },

  /** Últimas 50 ventas (para el admin no tiene filtro de fecha). */
  historialVentas(signal?: AbortSignal): Promise<VentaHistorial[]> {
    return http.get<VentaHistorial[]>('/ventas/historial', { signal });
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
