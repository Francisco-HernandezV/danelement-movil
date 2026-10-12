/**
 * Modelos del flujo de venta del vendedor (endpoints protegidos
 * `/api/ventas/*`, JWT + rol `rol_admin` o `rol_vendedor`).
 */

import { precioNumero } from './producto';

/**
 * Fila devuelta por `GET /api/ventas/buscar-producto?q=...`.
 *
 * El backend regresa UNA FILA POR VARIANTE (talla+color), no por producto.
 * `precio` viene como string desde PostgreSQL (`numeric`).
 */
export interface VarianteBusqueda {
  variante_id: number;
  producto_nombre: string;
  talla: string;
  color: string;
  sku: string;
  precio: string | number;
  stock_disponible: number;
}

/** Clave estable para listas: la variante es el elemento vendible. */
export function varianteKey(v: VarianteBusqueda): string {
  return String(v.variante_id);
}

/** Precio numérico seguro para operar/mostrar. */
export function precioVariante(v: VarianteBusqueda): number {
  return precioNumero(v.precio);
}

/** Nombre del producto (fallback por si viene vacío). */
export function nombreProducto(v: VarianteBusqueda): string {
  const n = (v.producto_nombre ?? '').trim();
  return n.length > 0 ? n : 'Producto sin nombre';
}

/** Agrupa variantes por `producto_nombre` para mostrar un producto con sus variantes. */
export interface ProductoAgrupado {
  nombre: string;
  variantes: VarianteBusqueda[];
}

export function agruparPorProducto(variantes: VarianteBusqueda[]): ProductoAgrupado[] {
  const map = new Map<string, ProductoAgrupado>();
  for (const v of variantes) {
    const key = nombreProducto(v);
    const grupo = map.get(key);
    if (grupo) {
      grupo.variantes.push(v);
    } else {
      map.set(key, { nombre: key, variantes: [v] });
    }
  }
  return [...map.values()];
}
