import { useCallback, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { ClienteBusqueda } from '@/data/models/cliente';
import { formatPrecio } from '@/data/models/producto';
import type { MetodoPago, ProcesarVentaRequest } from '@/data/models/venta';
import { ventasRepository } from '@/data/repositories/ventasRepository';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';
import {
  centavosAPesos,
  centavosATexto,
  pagosParaEnviar,
  pendienteParaPago,
  pesosACentavos,
  resumirCobro,
  sugerenciasEfectivo,
  type PagoCaptura,
} from './cobroCalculo';

/** Un pago tal como se entregó (para el desglose de la confirmación). */
export interface PagoCobrado {
  metodo: MetodoPago;
  /** Lo que entregó el cliente con este método (en efectivo incluye el cambio). */
  monto: number;
  referencia?: string;
}

/** Datos de la venta ya registrada (se congelan porque el carrito se limpia). */
export interface VentaCobrada {
  ventaId: number;
  total: number;
  pagos: PagoCobrado[];
  cambio: number;
  cliente: ClienteBusqueda | null;
  totalItems: number;
}

/** Campos editables de un pago. */
export type CambiosPago = Partial<Pick<PagoCaptura, 'metodo' | 'montoTexto' | 'referencia'>>;

/** Atajo de monto para un pago en efectivo ("Exacto", "$500", ...). */
export interface SugerenciaMonto {
  etiqueta: string;
  /** Texto que se escribe en el input al tocarla. */
  texto: string;
}

interface CobroOptions {
  /** Se llama cuando el backend registró la venta (el carrito ya se limpió). */
  onCobrada: (venta: VentaCobrada) => void;
}

/**
 * Lógica del paso de Pago del POS con PAGOS COMBINADOS.
 *
 * Lee la venta en curso del `VentaEnCursoContext` y mantiene una lista de
 * pagos (efectivo, tarjetas, transferencia; se pueden repetir). Arranca con
 * un pago en efectivo por el total (el caso más común: solo confirmar).
 * Solo un pago está "activo" (editándose) a la vez; los demás se muestran
 * resumidos. Cada pago nuevo propone como monto lo que falta por cubrir.
 * Las reglas de dinero viven en `cobroCalculo.ts`.
 * Al confirmar llama a `POST /api/ventas/procesar`:
 * - éxito → limpia el carrito (`nuevaVenta`) y entrega el desglose a `onCobrada`;
 * - error → conserva carrito y pagos capturados y expone el mensaje del
 *   backend (p. ej. caja cerrada o stock insuficiente).
 */
export function useCobroViewModel({ onCobrada }: CobroOptions) {
  const venta = useVentaEnCurso();
  const totalCentavos = pesosACentavos(venta.subtotal);

  const [pagos, setPagos] = useState<PagoCaptura[]>(() => [
    { id: 1, metodo: 'Efectivo', montoTexto: centavosATexto(totalCentavos), referencia: '' },
  ]);
  const [activoId, setActivoId] = useState<number | null>(1);
  const siguienteId = useRef(2);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Candado síncrono contra doble toque: el estado `enviando` tarda un render
  // en deshabilitar el botón y dos toques rápidos alcanzarían a pasar.
  const enviandoRef = useRef(false);

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

  const puedeConfirmar = !venta.isEmpty && resumen.completo && !enviando;

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
        {
          id,
          metodo: elegido,
          montoTexto: centavosATexto(resumen.restanteCentavos),
          referencia: '',
        },
      ]);
      setActivoId(id);
      setError(null);
    },
    [pagos, resumen.restanteCentavos],
  );

  /** Abre un pago resumido para editarlo (y cierra el que estaba activo). */
  const activarPago = useCallback((id: number) => setActivoId(id), []);

  const actualizarPago = useCallback((id: number, cambios: CambiosPago) => {
    setPagos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nuevo = { ...p, ...cambios };
        // El efectivo no lleva referencia.
        if (nuevo.metodo === 'Efectivo') nuevo.referencia = '';
        return nuevo;
      }),
    );
    setError(null);
  }, []);

  const quitarPago = useCallback(
    (id: number) => {
      const restantes = pagos.filter((p) => p.id !== id);
      setPagos(restantes);
      // Si se quitó el activo, queda activo el último (o ninguno).
      if (activoId === id) setActivoId(restantes.at(-1)?.id ?? null);
      setError(null);
    },
    [pagos, activoId],
  );

  const confirmar = useCallback(async () => {
    if (!puedeConfirmar || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);

    const payload: ProcesarVentaRequest = {
      cliente_id: venta.cliente?.id ?? null,
      items: venta.items.map((it) => ({ variante_id: it.variante_id, cantidad: it.cantidad })),
      // El cambio se descuenta del efectivo: lo enviado suma exactamente el total.
      pagos: pagosParaEnviar(pagos, resumen),
    };

    try {
      const res = await ventasRepository.procesarVenta(payload);
      const cobrada: VentaCobrada = {
        ventaId: res.venta_id,
        total: centavosAPesos(totalCentavos),
        pagos: pagos.map((p) => ({
          metodo: p.metodo,
          monto: centavosAPesos(resumen.montos[p.id] ?? 0),
          referencia: p.metodo !== 'Efectivo' && p.referencia.trim() ? p.referencia.trim() : undefined,
        })),
        cambio: centavosAPesos(resumen.cambioCentavos),
        cliente: venta.cliente,
        totalItems: venta.totalItems,
      };
      venta.nuevaVenta();
      onCobrada(cobrada);
    } catch (e) {
      // Los pagos capturados se conservan para reintentar.
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la venta. Inténtalo de nuevo.');
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [puedeConfirmar, venta, pagos, resumen, totalCentavos, onCobrada]);

  return {
    // Pagos
    pagos,
    activoId,
    activarPago,
    agregarPago,
    actualizarPago,
    quitarPago,
    sugerencias,
    /** Monto válido de cada pago en pesos (`null` si no es un monto > 0). */
    montos: Object.fromEntries(
      Object.entries(resumen.montos).map(([id, c]) => [id, c === null ? null : centavosAPesos(c)]),
    ) as Record<number, number | null>,
    erroresPago: resumen.erroresPago,
    errorPagos: resumen.error,

    // Totales (en pesos, listos para `formatPrecio`)
    total: centavosAPesos(resumen.totalCentavos),
    pagado: centavosAPesos(resumen.pagadoCentavos),
    restante: centavosAPesos(resumen.restanteCentavos),
    cambio: centavosAPesos(resumen.cambioCentavos),

    // Envío
    puedeConfirmar,
    enviando,
    error,
    confirmar,
  };
}
