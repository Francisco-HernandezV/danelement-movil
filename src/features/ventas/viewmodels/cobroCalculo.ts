import type { MetodoPago, PagoVenta } from '@/data/models/venta';

/**
 * Reglas de dinero del cobro con pagos combinados (sin React, para poder
 * probarlas aisladas). Todo se calcula en CENTAVOS enteros para no arrastrar
 * errores de punto flotante al comparar montos.
 *
 * Reglas:
 * - Cada pago debe tener un monto mayor a cero.
 * - Se pueden repetir métodos (p. ej. dos tarjetas distintas).
 * - Solo el efectivo da cambio: la suma de tarjetas + transferencias no puede
 *   superar el total.
 * - El cambio nunca puede ser mayor que lo pagado en efectivo.
 */

/** Un pago tal como lo captura el vendedor en pantalla. */
export interface PagoCaptura {
  /** Clave local estable para la lista (no viaja al backend). */
  id: number;
  metodo: MetodoPago;
  /** Texto del input ("1,500.50"); se valida al calcular. */
  montoTexto: string;
  /** Últimos 4 dígitos / folio. Solo aplica a tarjeta o transferencia. */
  referencia: string;
}

export interface ResumenCobro {
  totalCentavos: number;
  pagadoCentavos: number;
  efectivoCentavos: number;
  noEfectivoCentavos: number;
  restanteCentavos: number;
  cambioCentavos: number;
  /** Monto válido de cada pago (`null` si su texto no es un monto > 0). */
  montos: Record<number, number | null>;
  /** Error por pago (solo si escribió algo inválido; vacío no muestra error). */
  erroresPago: Record<number, string>;
  /** Error general que bloquea el cobro (p. ej. tarjetas por encima del total). */
  error: string | null;
  /** Todas las reglas se cumplen y el total está cubierto. */
  completo: boolean;
}

const esEfectivo = (m: MetodoPago) => m === 'Efectivo';

/** Pesos (número) → centavos enteros. */
export function pesosACentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/** Centavos → pesos con 2 decimales exactos. */
export function centavosAPesos(centavos: number): number {
  return centavos / 100;
}

/** Texto del input → centavos; `null` si está vacío o no es un número. */
export function parseCentavos(texto: string): number | null {
  const limpio = texto.replace(/,/g, '').trim();
  if (limpio.length === 0 || !/^\d*\.?\d*$/.test(limpio) || limpio === '.') return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? pesosACentavos(n) : null;
}

/** Texto para precargar un input de monto a partir de centavos ("123.50"). */
export function centavosATexto(centavos: number): string {
  return centavos > 0 ? centavosAPesos(centavos).toFixed(2) : '';
}

export function resumirCobro(totalCentavos: number, pagos: PagoCaptura[]): ResumenCobro {
  const montos: Record<number, number | null> = {};
  const erroresPago: Record<number, string> = {};
  let efectivo = 0;
  let noEfectivo = 0;
  let todosValidos = pagos.length > 0;

  for (const p of pagos) {
    const c = parseCentavos(p.montoTexto);
    const valido = c !== null && c > 0;
    montos[p.id] = valido ? c : null;
    if (!valido) {
      todosValidos = false;
      if (p.montoTexto.trim().length > 0) {
        erroresPago[p.id] = c === null ? 'Monto inválido.' : 'El monto debe ser mayor a cero.';
      }
      continue;
    }
    if (esEfectivo(p.metodo)) efectivo += c;
    else noEfectivo += c;
  }

  const pagado = efectivo + noEfectivo;
  const restante = Math.max(0, totalCentavos - pagado);
  const excedente = Math.max(0, pagado - totalCentavos);

  let error: string | null = null;
  if (noEfectivo > totalCentavos) {
    error = 'Las tarjetas y transferencias no pueden superar el total; solo el efectivo da cambio.';
  } else if (excedente > efectivo) {
    // Con la regla anterior no debería ocurrir; se deja como red de seguridad.
    error = 'El cambio no puede ser mayor que lo pagado en efectivo.';
  }

  // Si hay error, no ofrecemos cambio: el excedente vendría de tarjeta.
  const cambio = error ? 0 : excedente;

  return {
    totalCentavos,
    pagadoCentavos: pagado,
    efectivoCentavos: efectivo,
    noEfectivoCentavos: noEfectivo,
    restanteCentavos: restante,
    cambioCentavos: cambio,
    montos,
    erroresPago,
    error,
    completo: totalCentavos > 0 && todosValidos && error === null && restante === 0,
  };
}

/** Un pago con el monto que realmente se aplica (ya descontado el cambio). */
export interface PagoAplicado {
  pago: PagoCaptura;
  centavos: number;
}

/**
 * Descuenta el cambio de los pagos en efectivo (empezando por el último) para
 * que la suma aplicada sea exactamente lo cobrado y el corte de caja no cuente
 * el efectivo que se regresó al cliente. Conserva el orden y los pagos que
 * quedan en cero (quien llama decide si los omite).
 */
export function aplicarCambio(pagos: PagoCaptura[], resumen: ResumenCobro): PagoAplicado[] {
  let porDescontar = resumen.cambioCentavos;
  const aplicados = pagos.map((p) => ({ pago: p, centavos: resumen.montos[p.id] ?? 0 }));

  for (let i = aplicados.length - 1; i >= 0 && porDescontar > 0; i--) {
    const a = aplicados[i];
    if (!esEfectivo(a.pago.metodo)) continue;
    const resta = Math.min(a.centavos, porDescontar);
    a.centavos -= resta;
    porDescontar -= resta;
  }
  return aplicados;
}

/**
 * Pagos listos para `POST /api/ventas/procesar`: cambio descontado del
 * efectivo (ver `aplicarCambio`). Un pago que queda en cero se omite (el
 * backend también lo ignoraría).
 */
export function pagosParaEnviar(pagos: PagoCaptura[], resumen: ResumenCobro): PagoVenta[] {
  return aplicarCambio(pagos, resumen)
    .filter((a) => a.centavos > 0)
    .map(({ pago: p, centavos }) => {
      const pago: PagoVenta = { metodo: p.metodo, monto: centavosAPesos(centavos) };
      const ref = p.referencia.trim();
      if (!esEfectivo(p.metodo) && ref.length > 0) pago.referencia = ref;
      return pago;
    });
}

/**
 * Lo que le falta cubrir a un pago concreto: el total menos los demás pagos
 * válidos. Sirve para el botón "Exacto" y los billetes sugeridos.
 */
export function pendienteParaPago(totalCentavos: number, pagos: PagoCaptura[], id: number): number {
  let otros = 0;
  for (const p of pagos) {
    if (p.id === id) continue;
    const c = parseCentavos(p.montoTexto);
    if (c !== null && c > 0) otros += c;
  }
  return Math.max(0, totalCentavos - otros);
}

/** Denominaciones (en pesos) para redondear hacia arriba el efectivo recibido. */
const BILLETES = [50, 100, 200, 500, 1000];

/**
 * Billetes sugeridos para un pago en efectivo: los siguientes montos
 * "redondos" por encima de lo pendiente (máximo 3). No incluye el exacto.
 */
export function sugerenciasEfectivo(pendienteCentavos: number): number[] {
  if (pendienteCentavos <= 0) return [];
  const set = new Set<number>();
  for (const b of BILLETES) {
    const paso = b * 100;
    const redondo = Math.ceil(pendienteCentavos / paso) * paso;
    if (redondo > pendienteCentavos) set.add(redondo);
  }
  return [...set].sort((a, b) => a - b).slice(0, 3);
}
