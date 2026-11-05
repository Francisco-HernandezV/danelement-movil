/**
 * Modelos de Inventario (búsqueda de mercancía, matriz de variantes y
 * entradas de mercancía).
 *
 * Contrato confirmado contra `proyecto-usuarios`
 * (`backend/src/controllers/inventarioController.js`), rutas `/api/inventario/*`
 * con JWT + rol `rol_admin` o `rol_gestor_inventario` (anular: solo admin):
 *
 * - `GET  /buscar-producto?q=` (mín. 2 caracteres, máx. 20) → productos activos.
 * - `GET  /producto/:id/matriz` → tallas, colores y variantes ACTIVAS. Solo
 *   existen las combinaciones talla×color que tienen variante; el resto no
 *   puede recibir piezas.
 * - `POST /calcular-sugerencia` `{producto_id, total_piezas, costo_unitario}`
 *   → costo promedio ponderado nuevo y precio sugerido (margen del backend).
 * - `POST /entradas` `{origen_mercancia, nota_referencia, productos: [{producto_id,
 *   costo_unitario, nuevo_precio_venta, variantes: [{variante_id, cantidad}]}]}`.
 *   El `nuevo_precio_venta` se aplica a TODAS las variantes del producto.
 * - `GET  /entradas` (últimas 100) y `GET /entradas/:id`.
 * - `PUT  /entradas/:id/anular` `{motivo}` (obligatorio). 409 si ya se vendieron
 *   piezas del lote.
 *
 * Los `numeric`/`COUNT` de PostgreSQL pueden llegar como string.
 */

/** Resultado de `GET /inventario/buscar-producto`. */
export interface ProductoInventario {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: string | number;
  categoria_nombre: string | null;
  marca_nombre: string | null;
  total_variantes: string | number;
  stock_total: string | number;
}

export interface TallaMatriz {
  id: number;
  valor: string;
  tipo: string;
}

export interface ColorMatriz {
  id: number;
  nombre: string;
  codigo_hex: string | null;
}

export interface VarianteMatriz {
  variante_id: number;
  sku: string | null;
  talla_id: number;
  color_id: number;
  stock: number;
  costo_promedio: number;
  precio: number;
}

/** `GET /inventario/producto/:id/matriz`. */
export interface MatrizVariantes {
  producto: {
    id: number;
    nombre: string;
    precio_base: number;
    costo_promedio_actual: number;
    stock_total_actual: number;
  };
  tallas: TallaMatriz[];
  colores: ColorMatriz[];
  variantes: VarianteMatriz[];
}

/** `POST /inventario/calcular-sugerencia`. */
export interface SugerenciaPrecio {
  stock_total_actual: number;
  costo_promedio_actual: number;
  costo_promedio_nuevo: number;
  precio_sugerido: number;
  margen_aplicado: number;
}

export interface RegistrarEntradaRequest {
  origen_mercancia: string;
  nota_referencia: string;
  productos: {
    producto_id: number;
    costo_unitario: number;
    nuevo_precio_venta: number;
    variantes: { variante_id: number; cantidad: number }[];
  }[];
}

export interface RegistrarEntradaResponse {
  message: string;
  entrada_id: number;
  total_lote: number;
}

export type EstadoEntrada = 'activa' | 'anulada';

/** Fila de `GET /inventario/entradas`. */
export interface EntradaResumen {
  id: number;
  origen_mercancia: string | null;
  nota_referencia: string | null;
  total_lote: string | number;
  fecha_entrada: string;
  estado: EstadoEntrada;
  anulada_en: string | null;
  motivo_anulacion: string | null;
  usuario_nombre: string | null;
  anulada_por_nombre: string | null;
  total_renglones?: string | number;
  total_piezas?: string | number;
}

export interface RenglonEntrada {
  id: number;
  cantidad: number;
  costo_unitario: string | number;
  subtotal: string | number;
  sku: string | null;
  producto_nombre: string;
  talla: string;
  color: string;
}

/** `GET /inventario/entradas/:id`. */
export interface EntradaDetalle {
  cabecera: EntradaResumen;
  renglones: RenglonEntrada[];
}

// ════════════════════════════════════════════════════════════
//  HELPERS (puros, probados aparte)
// ════════════════════════════════════════════════════════════

/** Clave de una celda de la matriz. */
export function claveCelda(tallaId: number, colorId: number): string {
  return `${tallaId}-${colorId}`;
}

/** Índice celda → variante (solo existen las combinaciones con variante). */
export function indiceVariantes(m: MatrizVariantes): Map<string, VarianteMatriz> {
  const map = new Map<string, VarianteMatriz>();
  for (const v of m.variantes) map.set(claveCelda(v.talla_id, v.color_id), v);
  return map;
}

/** Orden de tallas de letra más común en la boutique. */
const ORDEN_LETRAS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL'];

/**
 * Ordena tallas de forma natural: números como números ("8" antes que "10"),
 * letras en su orden de prenda (S, M, L, XL) y lo demás alfabético. El backend
 * las ordena como texto ("10" < "8", "L" < "M" < "S").
 */
export function ordenarTallas<T extends { valor: string }>(tallas: T[]): T[] {
  const rango = (v: string): [number, number, string] => {
    const s = v.trim().toUpperCase();
    if (/^\d+(\.\d+)?$/.test(s)) return [0, Number(s), s];
    const i = ORDEN_LETRAS.indexOf(s);
    if (i >= 0) return [1, i, s];
    return [2, 0, s];
  };
  return [...tallas].sort((a, b) => {
    const ra = rango(a.valor);
    const rb = rango(b.valor);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
  });
}

/** Piezas capturadas: clave de celda → cantidad entera (> 0). */
export type Celdas = Record<string, number>;

export function totalPiezas(celdas: Celdas): number {
  return Object.values(celdas).reduce((s, n) => s + (n > 0 ? n : 0), 0);
}

/** Producto dentro del lote que se está capturando. */
export interface ProductoLote {
  matriz: MatrizVariantes;
  celdas: Celdas;
  /** Texto del input (se valida al construir). */
  costoTexto: string;
  precioTexto: string;
}

/** Convierte texto de dinero ("1,250.50") a número; `null` si vacío/ inválido. */
export function parseDinero(texto: string): number | null {
  const limpio = texto.replace(/,/g, '').trim();
  if (limpio.length === 0 || !/^\d*\.?\d*$/.test(limpio) || limpio === '.') return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Errores de captura de un producto del lote (vacío = listo). */
export function erroresProductoLote(p: ProductoLote): string[] {
  const errores: string[] = [];
  if (totalPiezas(p.celdas) <= 0) errores.push('Captura al menos una pieza en la matriz.');
  const costo = parseDinero(p.costoTexto);
  if (costo === null) errores.push('Indica el costo unitario.');
  const precio = parseDinero(p.precioTexto);
  if (precio === null || precio <= 0) errores.push('El precio de venta debe ser mayor a cero.');
  return errores;
}

/** Subtotal (costo) de un producto del lote. */
export function subtotalProductoLote(p: ProductoLote): number {
  return totalPiezas(p.celdas) * (parseDinero(p.costoTexto) ?? 0);
}

/**
 * Payload de `POST /inventario/entradas` a partir del lote. Solo incluye celdas
 * con piezas > 0 y que correspondan a una variante existente.
 */
export function construirEntrada(
  origen: string,
  nota: string,
  lote: ProductoLote[],
): RegistrarEntradaRequest {
  return {
    origen_mercancia: origen.trim(),
    nota_referencia: nota.trim(),
    productos: lote.map((p) => {
      const indice = indiceVariantes(p.matriz);
      return {
        producto_id: p.matriz.producto.id,
        costo_unitario: parseDinero(p.costoTexto) ?? 0,
        nuevo_precio_venta: parseDinero(p.precioTexto) ?? 0,
        variantes: Object.entries(p.celdas)
          .filter(([clave, cantidad]) => cantidad > 0 && indice.has(clave))
          .map(([clave, cantidad]) => ({
            variante_id: (indice.get(clave) as VarianteMatriz).variante_id,
            cantidad,
          })),
      };
    }),
  };
}
