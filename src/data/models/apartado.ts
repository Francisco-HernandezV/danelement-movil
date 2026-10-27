/**
 * Modelos del módulo de Apartados (layaway) del vendedor.
 *
 * Contrato confirmado contra `proyecto-usuarios`
 * (`backend/src/controllers/apartadosController.js`), endpoints protegidos
 * `/api/ventas/apartados*` (JWT + rol `rol_admin` o `rol_vendedor`):
 *
 * - Estados en BD: 'activo' | 'completado' | 'cancelado'. "Vencido" es
 *   DERIVADO (activo + `fecha_limite` < hoy) y llega como `vencido: boolean`.
 * - Crear reserva stock (`stock_apartado += cantidad`); liquidar (saldo 0) lo
 *   entrega (`stock -= cantidad`); cancelar lo libera.
 * - Crear y abonar exigen CAJA ABIERTA (400 con mensaje si no).
 * - Los `numeric` de PostgreSQL llegan como string → usar `precioNumero`.
 * - `fecha_limite` es DATE: node-postgres la serializa como medianoche ISO
 *   ("2026-11-02T00:00:00.000Z"), así que se formatea SIN zona horaria.
 */

import { precioNumero } from './producto';
import type { MetodoPago } from './venta';

export type EstadoApartado = 'activo' | 'completado' | 'cancelado';

/** Filtros de la lista (`?estado=`). 'todos' = sin filtro. */
export type FiltroApartado = 'activo' | 'vencido' | 'completado' | 'cancelado' | 'todos';

export const FILTROS_APARTADO: readonly { value: FiltroApartado; label: string }[] = [
  { value: 'activo', label: 'Activos' },
  { value: 'vencido', label: 'Vencidos' },
  { value: 'completado', label: 'Liquidados' },
  { value: 'cancelado', label: 'Cancelados' },
  { value: 'todos', label: 'Todos' },
];

/** Fila de `GET /api/ventas/apartados?estado=&q=` (máx. 200, vencidos primero). */
export interface ApartadoResumen {
  id: number;
  total: string | number;
  abonado: string | number;
  saldo: string | number;
  estado: EstadoApartado;
  fecha_limite: string;
  creado_en: string;
  vencido: boolean;
  /** Días hasta la fecha límite (negativo si ya venció). */
  dias_restantes: number;
  cliente_id: number;
  cliente_nombre: string | null;
  cliente_tel: string | null;
  vendedor_nombre: string | null;
}

/** Cabecera de `GET /api/ventas/apartados/:id`. */
export interface ApartadoCabecera {
  id: number;
  total: string | number;
  abonado: string | number;
  saldo: string | number;
  estado: EstadoApartado;
  fecha_limite: string;
  creado_en: string;
  vencido: boolean;
  cliente_nombre: string | null;
  cliente_tel: string | null;
  cliente_email: string | null;
  vendedor_nombre: string | null;
}

export interface ApartadoArticulo {
  cantidad: number;
  precio_unitario: string | number;
  subtotal: string | number;
  producto_nombre: string;
  sku: string;
  talla: string;
  color: string;
}

export interface ApartadoAbono {
  id: number;
  monto: string | number;
  metodo: string;
  fecha: string;
  usuario_nombre: string | null;
}

export interface ApartadoDetalle {
  apartado: ApartadoCabecera;
  articulos: ApartadoArticulo[];
  abonos: ApartadoAbono[];
}

/** Body de `POST /api/ventas/apartados`. */
export interface CrearApartadoRequest {
  /** Obligatorio: un apartado siempre es de un cliente. */
  cliente_id: number;
  items: { variante_id: number; cantidad: number }[];
  /** Anticipo opcional (0 = sin anticipo). No puede superar el total. */
  anticipo: number;
  metodo_anticipo: MetodoPago;
}

export interface CrearApartadoResponse {
  message: string;
  apartado_id: number;
  fecha_limite: string;
  total: number;
  abonado: number;
  saldo: number;
  /** 'completado' si el anticipo cubrió el total (se entrega de una vez). */
  estado: EstadoApartado;
}

/** Body de `POST /api/ventas/apartados/:id/abonos`. */
export interface AbonoRequest {
  /** > 0 y ≤ saldo. Si llega a cubrir el saldo, el backend liquida solo. */
  monto: number;
  metodo: MetodoPago;
}

export interface AbonoResponse {
  message: string;
  abonado: number;
  saldo: number;
  estado: EstadoApartado;
}

// ── Helpers de presentación ──

/** Estado visible: un activo con fecha vencida se muestra como "vencido". */
export type EstadoVisible = EstadoApartado | 'vencido';

export function estadoVisible(a: { estado: EstadoApartado; vencido: boolean }): EstadoVisible {
  return a.estado === 'activo' && a.vencido ? 'vencido' : a.estado;
}

export const ETIQUETA_ESTADO: Record<EstadoVisible, string> = {
  activo: 'Activo',
  vencido: 'Vencido',
  completado: 'Liquidado',
  cancelado: 'Cancelado',
};

/** Porcentaje abonado (0–100) para la barra de progreso. */
export function porcentajeAbonado(a: { total: string | number; abonado: string | number }): number {
  const total = precioNumero(a.total);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (precioNumero(a.abonado) / total) * 100));
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Fecha de calendario ("2 nov 2026") a partir de un DATE de PostgreSQL. Toma
 * solo "YYYY-MM-DD" para no correr el día por la zona horaria del teléfono.
 */
export function formatFechaLimite(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '—';
  return `${Number(m[3])} ${MESES[Number(m[2]) - 1]} ${m[1]}`;
}

/** Fecha y hora local de un TIMESTAMP (abonos, creación). */
export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()} · ${hh}:${mm}`;
}

/** Texto de vigencia: "Vence hoy", "Quedan 3 días", "Venció hace 2 días". */
export function textoVigencia(diasRestantes: number | null | undefined): string {
  const d = Number(diasRestantes);
  if (!Number.isFinite(d)) return '';
  if (d === 0) return 'Vence hoy';
  if (d === 1) return 'Vence mañana';
  if (d > 1) return `Quedan ${d} días`;
  return d === -1 ? 'Venció ayer' : `Venció hace ${Math.abs(d)} días`;
}

/**
 * Días de calendario desde hoy (fecha local del teléfono) hasta la fecha
 * límite. Negativo si ya pasó. El detalle no trae `dias_restantes`.
 */
export function diasHasta(iso: string | null | undefined): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  const limite = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const hoy = new Date();
  const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((limite - hoyUtc) / 86_400_000);
}
