import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { ClienteBusqueda } from '@/data/models/cliente';
import type { MetodoPago, ProcesarVentaRequest } from '@/data/models/venta';
import { ventasRepository } from '@/data/repositories/ventasRepository';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';
import { centavosAPesos, pagosParaEnviar, pesosACentavos } from './cobroCalculo';
import { usePagosCombinados } from './usePagosCombinados';

export type { CambiosPago, SugerenciaMonto } from './usePagosCombinados';

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

interface CobroOptions {
  /** Se llama cuando el backend registró la venta (el carrito ya se limpió). */
  onCobrada: (venta: VentaCobrada) => void;
}

/**
 * Lógica del cobro del POS con PAGOS COMBINADOS.
 *
 * La captura de pagos (lista, pago activo, sugerencias de billetes) vive en
 * `usePagosCombinados`; arranca con un pago en efectivo por el total (el caso
 * más común: solo confirmar). Al confirmar llama a `POST /api/ventas/procesar`:
 * - éxito → limpia el carrito (`nuevaVenta`) y entrega el desglose a `onCobrada`;
 * - error → conserva carrito y pagos capturados y expone el mensaje del
 *   backend (p. ej. caja cerrada o stock insuficiente).
 */
export function useCobroViewModel({ onCobrada }: CobroOptions) {
  const venta = useVentaEnCurso();
  const totalCentavos = pesosACentavos(venta.subtotal);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limpiarError = useCallback(() => setError(null), []);

  const p = usePagosCombinados(totalCentavos, {
    montoInicialCentavos: totalCentavos,
    onEditar: limpiarError,
  });
  const { pagos, resumen } = p;

  // Candado síncrono contra doble toque: el estado `enviando` tarda un render
  // en deshabilitar el botón y dos toques rápidos alcanzarían a pasar.
  const enviandoRef = useRef(false);

  const puedeConfirmar = !venta.isEmpty && resumen.completo && !enviando;

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
        pagos: pagos.map((pg) => ({
          metodo: pg.metodo,
          monto: centavosAPesos(resumen.montos[pg.id] ?? 0),
          referencia: pg.metodo !== 'Efectivo' && pg.referencia.trim() ? pg.referencia.trim() : undefined,
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
    activoId: p.activoId,
    activarPago: p.activarPago,
    agregarPago: p.agregarPago,
    actualizarPago: p.actualizarPago,
    quitarPago: p.quitarPago,
    sugerencias: p.sugerencias,
    montos: p.montos,
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
