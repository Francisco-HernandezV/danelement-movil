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

// ════════════════════════════════════════════════════════════
//  REPORTE DE VENTAS
// ════════════════════════════════════════════════════════════

/** Periodos rápidos del reporte. */
export type PeriodoReporte = 'hoy' | '7d' | '30d' | 'mes' | 'mes_anterior' | 'anio';

export const PERIODOS_REPORTE: readonly { value: PeriodoReporte; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'mes', label: 'Este mes' },
  { value: 'mes_anterior', label: 'Mes anterior' },
  { value: 'anio', label: 'Este año' },
];

/** Rango `YYYY-MM-DD` (ambos incluidos) de un periodo, según la fecha local. */
export function rangoPeriodo(p: PeriodoReporte, hoy: Date = new Date()): { inicio: string; fin: string } {
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  switch (p) {
    case 'hoy':
      return rangoUltimosDias(1, hoy);
    case '7d':
      return rangoUltimosDias(7, hoy);
    case '30d':
      return rangoUltimosDias(30, hoy);
    case 'mes':
      return { inicio: fechaISO(new Date(y, m, 1)), fin: fechaISO(hoy) };
    case 'mes_anterior':
      return { inicio: fechaISO(new Date(y, m - 1, 1)), fin: fechaISO(new Date(y, m, 0)) };
    case 'anio':
      return { inicio: fechaISO(new Date(y, 0, 1)), fin: fechaISO(hoy) };
  }
}

/** Un punto de la gráfica (día o mes). */
export interface PuntoSerie {
  /** `YYYY-MM-DD` (día) o `YYYY-MM` (mes). */
  clave: string;
  /** Etiqueta corta para el eje ("27", "oct"). */
  etiqueta: string;
  /** Etiqueta completa para la lectura al tocar ("27 oct 2026", "octubre 2026"). */
  etiquetaLarga: string;
  monto: number;
  prendas: number;
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Más días que esto se agrupan por mes (una barra por mes). */
export const MAX_DIAS_POR_DIA = 62;

function aFecha(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Serie continua para la gráfica: el backend solo devuelve los días CON
 * ventas, así que se rellenan con 0 los días sin ventas del rango. Si el rango
 * pasa de `MAX_DIAS_POR_DIA` días, se agrupa por mes.
 */
export function serieVentas(diario: VentaDiaria[], rango: { inicio: string; fin: string }): PuntoSerie[] {
  const porDia = new Map<string, { monto: number; prendas: number }>();
  for (const d of diario) {
    const clave = String(d.fecha).slice(0, 10);
    porDia.set(clave, { monto: Number(d.total_monto) || 0, prendas: Number(d.total_prendas) || 0 });
  }

  const inicio = aFecha(rango.inicio);
  const fin = aFecha(rango.fin);
  const dias = Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1;
  const porMes = dias > MAX_DIAS_POR_DIA;

  const puntos: PuntoSerie[] = [];
  const indice = new Map<string, PuntoSerie>();
  for (let i = 0; i < dias; i++) {
    const f = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    const dia = fechaISO(f);
    const clave = porMes ? dia.slice(0, 7) : dia;
    let p = indice.get(clave);
    if (!p) {
      p = porMes
        ? {
            clave,
            etiqueta: MESES_CORTOS[f.getMonth()],
            etiquetaLarga: `${MESES_LARGOS[f.getMonth()]} ${f.getFullYear()}`,
            monto: 0,
            prendas: 0,
          }
        : {
            clave,
            etiqueta: String(f.getDate()),
            etiquetaLarga: `${f.getDate()} ${MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}`,
            monto: 0,
            prendas: 0,
          };
      indice.set(clave, p);
      puntos.push(p);
    }
    const v = porDia.get(dia);
    if (v) {
      p.monto += v.monto;
      p.prendas += v.prendas;
    }
  }
  return puntos;
}

/** Monto compacto para ejes y barras: $950, $1.2K, $24K, $1.3M. */
export function montoCompacto(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `$${Math.round(n)}`;
}

/** Venta de `GET /api/ventas/historial` (admin: últimas 50, sin filtro). */
export interface VentaHistorial {
  id: number;
  total: string | number;
  creado_en: string;
  estado: string;
  cliente_nombre: string | null;
  vendedor_nombre: string | null;
}

/** Categoría de `GET /api/admin/categorias` (pública). */
export interface CategoriaAdmin {
  id: number;
  nombre: string;
  activo?: boolean;
}

/** "1 prenda" / "3 prendas". */
export function textoPrendas(n: number): string {
  return `${n} ${n === 1 ? 'prenda' : 'prendas'}`;
}

/** "1 ticket" / "3 tickets". */
export function textoTickets(n: number): string {
  return `${n} ${n === 1 ? 'ticket' : 'tickets'}`;
}
