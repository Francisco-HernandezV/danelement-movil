import { useCallback, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { ClienteBusqueda } from '@/data/models/cliente';
import type { MetodoPago, ProcesarVentaRequest } from '@/data/models/venta';
import { ventasRepository } from '@/data/repositories/ventasRepository';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';
import {
  centavosAPesos,
  centavosATexto,
  pagosParaEnviar,
  pesosACentavos,
  resumirCobro,
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

/**
 * Lógica de la pantalla de Cobro del POS con PAGOS COMBINADOS.
 *
 * Lee la venta en curso del `VentaEnCursoContext` y mantiene una lista de
 * pagos (efectivo, tarjetas, transferencia; se pueden repetir) que el vendedor
 * agrega, edita y quita. Las reglas de dinero viven en `cobroCalculo.ts`.
 * Al confirmar llama a `POST /api/ventas/procesar`:
 * - éxito → guarda el folio y el desglose, limpia el carrito (`nuevaVenta`) y
 *   la pantalla muestra la confirmación;
 * - error → conserva carrito y pagos capturados y expone el mensaje del
 *   backend (p. ej. caja cerrada o stock insuficiente).
 */
export function useCobroViewModel() {
  const venta = useVentaEnCurso();
  const totalCentavos = pesosACentavos(venta.subtotal);

  // Arranca con un pago en efectivo por el total (el caso más común).
  const [pagos, setPagos] = useState<PagoCaptura[]>(() => [
    { id: 1, metodo: 'Efectivo', montoTexto: centavosATexto(totalCentavos), referencia: '' },
  ]);
  const siguienteId = useRef(2);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cobrada, setCobrada] = useState<VentaCobrada | null>(null);

  // Candado síncrono contra doble toque: el estado `enviando` tarda un render
  // en deshabilitar el botón y dos toques rápidos alcanzarían a pasar.
  const enviandoRef = useRef(false);

  const resumen = useMemo(() => resumirCobro(totalCentavos, pagos), [totalCentavos, pagos]);

  const puedeConfirmar = !venta.isEmpty && resumen.completo && !enviando && cobrada === null;

  /** Agrega un pago proponiendo como monto lo que falta por cubrir. */
  const agregarPago = useCallback(() => {
    const id = siguienteId.current++;
    setPagos((prev) => [
      ...prev,
      {
        id,
        // El primero suele ser efectivo; los siguientes, tarjeta.
        metodo: prev.length === 0 ? 'Efectivo' : 'T. Débito',
        montoTexto: centavosATexto(resumirCobro(totalCentavos, prev).restanteCentavos),
        referencia: '',
      },
    ]);
    setError(null);
  }, [totalCentavos]);

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

  const quitarPago = useCallback((id: number) => {
    setPagos((prev) => prev.filter((p) => p.id !== id));
    setError(null);
  }, []);

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
      setCobrada({
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
      });
      venta.nuevaVenta();
    } catch (e) {
      // Los pagos capturados se conservan para reintentar.
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la venta. Inténtalo de nuevo.');
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [puedeConfirmar, venta, pagos, resumen, totalCentavos]);

  return {
    // Resumen de la venta en curso
    cliente: venta.cliente,
    sinCliente: venta.sinCliente,
    items: venta.items,
    totalItems: venta.totalItems,
    carritoVacio: venta.isEmpty,

    // Pagos
    pagos,
    agregarPago,
    actualizarPago,
    quitarPago,
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
    cobrada,
    confirmar,
  };
}
