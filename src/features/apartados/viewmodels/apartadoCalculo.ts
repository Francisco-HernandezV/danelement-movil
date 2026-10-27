import type { ResumenCobro } from '@/features/ventas/viewmodels/cobroCalculo';

/**
 * Reglas de dinero de Apartados (sin React, para probarlas aisladas). Todo en
 * CENTAVOS enteros; el texto del input se convierte antes con `parseCentavos`
 * (`features/ventas/viewmodels/cobroCalculo.ts`), que devuelve `null` si el
 * texto está vacío o no es un número.
 *
 * Mismas reglas que valida el backend, para avisar antes de enviar:
 * - Abono: uno o VARIOS métodos; suma > 0 y, aplicada, no mayor al saldo. El
 *   efectivo puede exceder (da cambio); tarjetas + transferencias no.
 * - Anticipo: igual que un abono pero contra el TOTAL y OPCIONAL (sin montos
 *   capturados = sin anticipo).
 */

export interface AbonoCalculado {
  /** Lo que se abona al apartado (pagado − cambio; nunca más que el saldo). */
  abonoCentavos: number;
  /** Cambio a entregar (solo sale del efectivo). */
  cambioCentavos: number;
  /** Saldo que quedará después del abono. */
  saldoRestanteCentavos: number;
  /** El abono cubre todo el saldo: el backend liquida y entrega. */
  liquida: boolean;
  /** Error general que bloquea el abono. */
  error: string | null;
  /** Se puede registrar (pagos válidos, sin error y abono > 0). */
  valido: boolean;
}

/**
 * Abono con uno o varios métodos. `resumen` es `resumirCobro(saldo, pagos)`:
 * a diferencia del cobro del POS, un abono NO tiene que cubrir todo el saldo.
 */
export function resumirAbono(
  resumen: ResumenCobro,
  /** Contra qué se mide, para el mensaje de error. */
  contra: 'saldo' | 'total' = 'saldo',
): AbonoCalculado {
  const montos = Object.values(resumen.montos);
  const todosValidos = montos.length > 0 && montos.every((m) => m !== null);

  let error: string | null = null;
  if (resumen.noEfectivoCentavos > resumen.totalCentavos) {
    error = `Las tarjetas y transferencias no pueden superar el ${contra}; solo el efectivo da cambio.`;
  } else if (resumen.error) {
    error = resumen.error;
  }

  const abono = error
    ? 0
    : Math.min(resumen.pagadoCentavos - resumen.cambioCentavos, resumen.totalCentavos);
  const saldoRestante = Math.max(0, resumen.totalCentavos - abono);

  return {
    abonoCentavos: abono,
    cambioCentavos: error ? 0 : resumen.cambioCentavos,
    saldoRestanteCentavos: saldoRestante,
    liquida: error === null && resumen.totalCentavos > 0 && saldoRestante === 0,
    error,
    valido: todosValidos && error === null && abono > 0,
  };
}

/**
 * Anticipo al crear el apartado, con uno o varios métodos. `resumen` es
 * `resumirCobro(total, pagos)`; si no se capturó ningún monto, no hay
 * anticipo y es válido.
 */
export function resumirAnticipo(resumen: ResumenCobro, sinMontos: boolean): AbonoCalculado {
  if (sinMontos) {
    return {
      abonoCentavos: 0,
      cambioCentavos: 0,
      saldoRestanteCentavos: resumen.totalCentavos,
      liquida: false,
      error: null,
      valido: true,
    };
  }
  return resumirAbono(resumen, 'total');
}
