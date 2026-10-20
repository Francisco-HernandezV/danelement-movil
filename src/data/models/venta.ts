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

// ════════════════════════════════════════════════════════════
//  COBRO — `POST /api/ventas/procesar`
// ════════════════════════════════════════════════════════════
//
// Contrato confirmado contra `proyecto-usuarios`
// (`backend/src/controllers/ventasController.js#procesarVenta`) y el POS web
// (`frontend/src/pages/pos/POS.jsx#finalizarVenta`):
//
// - Body: `{ cliente_id, items: [{ variante_id, cantidad }], pagos: [{ metodo, monto }] }`.
// - El backend NO recibe precios: vuelve a leer `precio` de cada variante con
//   `FOR UPDATE`, valida stock (`stock - stock_apartado`) y calcula el total.
// - Exige caja abierta; si no, responde 400 con
//   "La caja no está abierta. Registra el monto inicial para poder cobrar."
// - Éxito: 201 `{ message, venta_id }`. Error de negocio: 400 `{ message }`.
// - PAGOS COMBINADOS: `pagos` es un arreglo; el backend inserta una fila en
//   `ventas.pagos` por cada pago con `monto > 0` (los demás se ignoran). Se
//   pueden repetir métodos (p. ej. dos tarjetas). El backend NO valida que la
//   suma cubra el total: esa regla la aplica el cliente (ver `cobroCalculo.ts`).
// - `metodo` es texto libre en BD. El corte de caja lo agrupa con `ILIKE`
//   ('%efectivo%', '%tarjeta%'/'%bito%'/'%dito%', '%transfer%') y el ticket PDF
//   lo imprime tal cual, por eso usamos exactamente los mismos textos que la web.
// - `ventas.pagos` solo tiene (venta_id, metodo, monto): la `referencia` se
//   envía pero el backend hoy la ignora (no hay columna donde guardarla).

/**
 * Métodos de pago aceptados. Son los valores que ya escribe el POS web en
 * `ventas.pagos.metodo`; usar otros (p. ej. 'tarjeta_debito') funcionaría en el
 * corte, pero mezclaría formatos en el historial y en el ticket impreso.
 */
export type MetodoPago = 'Efectivo' | 'T. Débito' | 'T. Crédito' | 'Transferencia';

export const METODOS_PAGO: readonly { value: MetodoPago; label: string }[] = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'T. Débito', label: 'Débito' },
  { value: 'T. Crédito', label: 'Crédito' },
  { value: 'Transferencia', label: 'Transferencia' },
];

export interface ProcesarVentaItem {
  variante_id: number;
  cantidad: number;
}

/** `true` si el método admite referencia (tarjetas y transferencia). */
export function metodoConReferencia(m: MetodoPago): boolean {
  return m !== 'Efectivo';
}

export interface PagoVenta {
  metodo: MetodoPago;
  /**
   * Monto APLICADO a la venta. En efectivo es lo recibido MENOS el cambio: si
   * mandáramos lo recibido, el cambio entregado inflaría el efectivo del corte.
   */
  monto: number;
  /**
   * Opcional: últimos 4 dígitos de la tarjeta o folio de la transferencia.
   * El backend actual no la persiste (ver nota del contrato arriba).
   */
  referencia?: string;
}

export interface ProcesarVentaRequest {
  /** `null` = venta de mostrador (sin cliente). */
  cliente_id: number | null;
  items: ProcesarVentaItem[];
  /** Uno o más pagos; la suma aplicada debe ser igual al total de la venta. */
  pagos: PagoVenta[];
}

export interface ProcesarVentaResponse {
  message: string;
  /** Folio de la venta registrada. */
  venta_id: number;
}
