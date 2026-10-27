/**
 * Modelos del módulo de Administrador.
 *
 * Contrato confirmado contra `proyecto-usuarios` (backend):
 * - `GET /api/admin/reportes/ventas?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD[&categoria_id=]`
 *   (rol admin|gestor) → `{ diario, kpis, topCategorias, topProductos }`.
 *   Las fechas se comparan contra `ventas.creado_en::date` en la zona horaria
 *   del servidor.
 * - `GET /api/admin/inventario` (admin|gestor|vendedor) → todas las variantes.
 * - `GET /api/ventas/caja/estado` (admin|vendedor) → `{ abierta, ... }`.
 * - `GET /api/ventas/apartados/vencidos` (admin|vendedor).
 *
 * PostgreSQL devuelve `numeric`/`COUNT` como string → usar `precioNumero`.
 */

/** KPIs del periodo (`kpis` del reporte). */
export interface KpisVentas {
  total_prendas: string | number;
  total_ingresos: string | number;
  total_tickets: string | number;
}

export interface VentaDiaria {
  fecha: string;
  total_prendas: string | number;
  total_monto: string | number;
}

export interface ReporteVentas {
  diario: VentaDiaria[];
  kpis: KpisVentas;
  topCategorias: { name: string; value: string | number }[];
  topProductos: { producto: string; cantidad: string | number; ingresos: string | number }[];
}

export interface EstadoCaja {
  abierta: boolean;
  turno_id?: number;
  monto_inicial?: number;
  fecha_apertura?: string;
}

/** Variante de `GET /api/admin/inventario` (solo los campos que usa la app). */
export interface VarianteInventario {
  id: number;
  producto_id: number;
  producto_nombre: string;
  talla: string;
  color: string;
  sku: string | null;
  stock: number;
  stock_apartado: number | null;
  activo: boolean;
}

/** Fila de `GET /api/ventas/apartados/vencidos`. */
export interface ApartadoVencido {
  id: number;
  saldo: string | number;
  dias_vencido: number;
  cliente_nombre: string | null;
}

/** Mismo umbral que el dashboard web (`stock <= 5`). */
export const UMBRAL_STOCK_BAJO = 5;

/** Fecha local del teléfono como `YYYY-MM-DD` (lo que espera el reporte). */
export function fechaISO(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Rango de los últimos `dias` días, incluyendo hoy. */
export function rangoUltimosDias(dias: number, hoy: Date = new Date()): { inicio: string; fin: string } {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (dias - 1));
  return { inicio: fechaISO(inicio), fin: fechaISO(hoy) };
}

/** Variantes activas con stock bajo, de menor a mayor existencia. */
export function variantesStockBajo(
  inventario: VarianteInventario[],
  umbral: number = UMBRAL_STOCK_BAJO,
): VarianteInventario[] {
  return inventario
    .filter((v) => v.activo !== false && Number(v.stock) <= umbral)
    .sort((a, b) => Number(a.stock) - Number(b.stock));
}
