/** Modelos del catálogo (endpoints públicos de `/api/admin`). */

/** Categoría pública (`GET /admin/categorias`). */
export interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
}

/**
 * Producto de la lista pública (`GET /admin/productos`).
 * `precio_base` llega como string desde PostgreSQL (tipo numeric).
 */
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: string | number;
  activo: boolean;
  categoria_id: number | null;
  categoria_nombre: string | null;
  marca_id: number | null;
  marca_nombre: string | null;
  departamento_id: number | null;
  departamento_nombre: string | null;
  /** URL de Cloudinary de la foto de portada, o null. */
  imagen: string | null;
  total_imagenes: number;
}

/** Imagen de la galería (`imagenes[]` en el detalle). */
export interface ImagenProducto {
  id: number;
  url: string;
  public_id: string | null;
  orden: number | null;
  principal: boolean;
  variante_id: number | null;
}

/** Detalle de producto (`GET /admin/productos/:id/detalle`): producto + galería. */
export interface ProductoDetalle extends Producto {
  imagenes: ImagenProducto[];
}

/** Precio numérico seguro a partir de `precio_base`. */
export function precioNumero(value: string | number | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Formatea un precio a pesos mexicanos: `$1,299.00`. */
export function formatPrecio(value: string | number | null | undefined): string {
  return `$${precioNumero(value).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
