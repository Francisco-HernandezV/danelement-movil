import { http } from '@/config/http';
import type {
  EntradaDetalle,
  EntradaResumen,
  MatrizVariantes,
  ProductoInventario,
  RegistrarEntradaRequest,
  RegistrarEntradaResponse,
  SugerenciaPrecio,
} from '@/data/models/inventario';

/**
 * Repo de Inventario (`/api/inventario/*`). Requiere JWT con rol `rol_admin`
 * o `rol_gestor_inventario`; anular una entrada es solo para `rol_admin`.
 * Las escrituras no reciben `signal`: no se cancelan a medio camino.
 */
export const inventarioRepository = {
  /** Productos activos por nombre (mín. 2 caracteres, máx. 20 resultados). */
  buscarProducto(q: string, signal?: AbortSignal): Promise<ProductoInventario[]> {
    return http.get<ProductoInventario[]>(
      `/inventario/buscar-producto?q=${encodeURIComponent(q)}`,
      { signal },
    );
  },

  /** Tallas, colores y variantes activas de un producto, con stock y costos. */
  matriz(productoId: number, signal?: AbortSignal): Promise<MatrizVariantes> {
    return http.get<MatrizVariantes>(`/inventario/producto/${productoId}/matriz`, { signal });
  },

  /** Costo promedio nuevo y precio sugerido para las piezas que entran. */
  calcularSugerencia(
    payload: { producto_id: number; total_piezas: number; costo_unitario: number },
    signal?: AbortSignal,
  ): Promise<SugerenciaPrecio> {
    return http.post<SugerenciaPrecio>('/inventario/calcular-sugerencia', payload, { signal });
  },

  /** Registra la entrada: suma stock, recalcula costo promedio y fija precio. */
  registrarEntrada(payload: RegistrarEntradaRequest): Promise<RegistrarEntradaResponse> {
    return http.post<RegistrarEntradaResponse>('/inventario/entradas', payload);
  },

  /** Últimas 100 entradas. */
  entradas(signal?: AbortSignal): Promise<EntradaResumen[]> {
    return http.get<EntradaResumen[]>('/inventario/entradas', { signal });
  },

  detalleEntrada(id: number, signal?: AbortSignal): Promise<EntradaDetalle> {
    return http.get<EntradaDetalle>(`/inventario/entradas/${id}`, { signal });
  },

  /** Anula una entrada (revierte el stock). Solo administrador. */
  anularEntrada(id: number, motivo: string): Promise<{ message: string }> {
    return http.put<{ message: string }>(`/inventario/entradas/${id}/anular`, { motivo });
  },
};
