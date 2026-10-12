import { http } from '@/config/http';
import type { Categoria, Producto, ProductoDetalle } from '@/data/models/producto';

/**
 * Acceso a los endpoints PÚBLICOS del catálogo (no requieren sesión).
 * Son los mismos que consume la web desde `/api/admin/...`.
 */
export const catalogoRepository = {
  /** Lista completa de productos (el filtrado/búsqueda se hace en cliente). */
  getProductos(signal?: AbortSignal): Promise<Producto[]> {
    return http.get<Producto[]>('/admin/productos', { auth: false, signal });
  },

  /** Categorías para los chips y el panel de filtros. */
  getCategorias(signal?: AbortSignal): Promise<Categoria[]> {
    return http.get<Categoria[]>('/admin/categorias', { auth: false, signal });
  },

  /** Detalle de un producto con su galería de imágenes. */
  getProductoDetalle(id: number | string, signal?: AbortSignal): Promise<ProductoDetalle> {
    return http.get<ProductoDetalle>(`/admin/productos/${id}/detalle`, { auth: false, signal });
  },
};
