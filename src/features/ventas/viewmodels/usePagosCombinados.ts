import { useCallback, useMemo, useRef, useState } from 'react';

import { formatPrecio } from '@/data/models/producto';
import type { MetodoPago } from '@/data/models/venta';
import {
  centavosAPesos,
  centavosATexto,
  pendienteParaPago,
  resumirCobro,
  sugerenciasEfectivo,
  type PagoCaptura,
} from './cobroCalculo';

/** Campos editables de un pago. */
export type CambiosPago = Partial<Pick<PagoCaptura, 'metodo' | 'montoTexto' | 'referencia'>>;

/** Atajo de monto para un pago en efectivo ("Exacto", "$500", ...). */
export interface SugerenciaMonto {
  etiqueta: string;
  /** Texto que se escribe en el input al tocarla. */
  texto: string;
}

interface Opciones {
  /** Monto inicial del primer pago en efectivo (centavos; 0 = vacío). */
  montoInicialCentavos: number;
  /** Se llama tras cualquier edición (p. ej. para limpiar errores del envío). */
  onEditar?: () => void;
}

/**
 * Captura de PAGOS COMBINADOS, compartida por el cobro del POS y los abonos
 * de apartados: lista de pagos (efectivo, tarjetas, transferencia; se pueden
 * repetir) con uno solo "activo" (editándose) a la vez.
 *
 * `totalCentavos` es lo que hay que cubrir (total de la venta o saldo del
 * apartado). Las reglas de dinero viven en `cobroCalculo.ts`: cada pago > 0,
 * tarjetas + transferencias ≤ total, el cambio solo sale del efectivo.
 */
export function usePagosCombinados(totalCentavos: number, { montoInicialCentavos, onEditar }: Opciones) {
  const [pagos, setPagos] = useState<PagoCaptura[]>(() => [
    { id: 1, metodo: 'Efectivo', montoTexto: centavosATexto(montoInicialCentavos), referencia: '' },
  ]);
  const [activoId, setActivoId] = useState<number | null>(1);
  const siguienteId = useRef(2);

  const resumen = useMemo(() => resumirCobro(totalCentavos, pagos), [totalCentavos, pagos]);

  /** Atajos de monto para cada pago en efectivo, según lo que le falta cubrir. */
  const sugerencias = useMemo(() => {
    const out: Record<number, SugerenciaMonto[]> = {};
    for (const p of pagos) {
      if (p.metodo !== 'Efectivo') continue;
      const pendiente = pendienteParaPago(totalCentavos, pagos, p.id);
      if (pendiente <= 0) continue;
      out[p.id] = [
        { etiqueta: 'Exacto', texto: centavosATexto(pendiente) },
        ...sugerenciasEfectivo(pendiente).map((c) => ({
          etiqueta: formatPrecio(centavosAPesos(c)),
          texto: centavosATexto(c),
        })),
      ];
    }
    return out;
  }, [totalCentavos, pagos]);

  /** Monto válido de cada pago en pesos (`null` si no es un monto > 0). */
  const montos = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(resumen.montos).map(([id, c]) => [id, c === null ? null : centavosAPesos(c)]),
      ) as Record<number, number | null>,
    [resumen.montos],
  );

  /**
   * Agrega otra forma de pago por lo que falta cubrir y la deja activa. Sin
   * método explícito propone tarjeta si ya hay efectivo (el combo más común).
   */
  const agregarPago = useCallback(
    (metodo?: MetodoPago) => {
      const id = siguienteId.current++;
      const elegido: MetodoPago =
        metodo ?? (pagos.some((p) => p.metodo === 'Efectivo') ? 'T. Débito' : 'Efectivo');
      setPagos([
        ...pagos,
        { id, metodo: elegido, montoTexto: centavosATexto(resumen.restanteCentavos), referencia: '' },
      ]);
      setActivoId(id);
      onEditar?.();
    },
    [pagos, resumen.restanteCentavos, onEditar],
  );

  /** Abre un pago resumido para editarlo (y cierra el que estaba activo). */
  const activarPago = useCallback((id: number) => setActivoId(id), []);

  const actualizarPago = useCallback(
    (id: number, cambios: CambiosPago) => {
      setPagos((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const nuevo = { ...p, ...cambios };
          // El efectivo no lleva referencia.
          if (nuevo.metodo === 'Efectivo') nuevo.referencia = '';
          return nuevo;
        }),
      );
      onEditar?.();
    },
    [onEditar],
  );

  /** Quita uno o varios pagos (p. ej. los que ya se registraron). */
  const quitarPagos = useCallback(
    (ids: number[]) => {
      const restantes = pagos.filter((p) => !ids.includes(p.id));
      setPagos(restantes);
      // Si se quitó el activo, queda activo el último (o ninguno).
      if (activoId !== null && ids.includes(activoId)) setActivoId(restantes.at(-1)?.id ?? null);
      onEditar?.();
    },
    [pagos, activoId, onEditar],
  );

  const quitarPago = useCallback((id: number) => quitarPagos([id]), [quitarPagos]);

  /** Vuelve a un solo pago en efectivo (vacío o por el monto indicado). */
  const reiniciar = useCallback((montoCentavos = 0) => {
    const id = siguienteId.current++;
    setPagos([{ id, metodo: 'Efectivo', montoTexto: centavosATexto(montoCentavos), referencia: '' }]);
    setActivoId(id);
  }, []);

  return {
    pagos,
    activoId,
    resumen,
    sugerencias,
    montos,
    agregarPago,
    activarPago,
    actualizarPago,
    quitarPago,
    quitarPagos,
    reiniciar,
  };
}
