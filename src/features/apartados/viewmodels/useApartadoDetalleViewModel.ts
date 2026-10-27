import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import { estadoVisible, type AbonoResponse, type ApartadoDetalle } from '@/data/models/apartado';
import { formatPrecio, precioNumero } from '@/data/models/producto';
import { apartadosRepository } from '@/data/repositories/apartadosRepository';
import {
  aplicarCambio,
  centavosAPesos,
  pesosACentavos,
} from '@/features/ventas/viewmodels/cobroCalculo';
import { usePagosCombinados } from '@/features/ventas/viewmodels/usePagosCombinados';
import { resumirAbono } from './apartadoCalculo';

function mensajeDeError(e: unknown, porDefecto: string): string {
  return e instanceof ApiError ? e.message : porDefecto;
}

/**
 * Lógica del detalle de un apartado: cabecera, artículos, historial de
 * abonos, registrar abono (o liquidar el saldo) y cancelar.
 *
 * ABONOS CON VARIOS MÉTODOS: la captura reutiliza `usePagosCombinados` (la
 * misma del cobro del POS) con el SALDO como total. El backend registra UN
 * método por abono (`POST /apartados/:id/abonos {monto, metodo}`), así que se
 * envía un abono por cada forma de pago, en orden y uno a la vez:
 * - el cambio se descuenta antes del efectivo (lo abonado nunca excede el saldo);
 * - si el último cubre el saldo, el backend liquida y entrega la mercancía;
 * - NO es atómico: si uno falla, se detiene, se quitan de la lista los que sí
 *   quedaron registrados, se recarga el saldo y se informa qué pasó.
 */
export function useApartadoDetalleViewModel(id: number) {
  const [detalle, setDetalle] = useState<ApartadoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Abono
  const [abonoAbierto, setAbonoAbierto] = useState(false);
  const [enviandoAbono, setEnviandoAbono] = useState(false);
  const [errorAbono, setErrorAbono] = useState<string | null>(null);

  // Cancelación
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const escribiendo = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    const controller = new AbortController();
    apartadosRepository
      .detalle(id, controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setDetalle(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
        setError(mensajeDeError(e, 'No se pudo cargar el apartado.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [id, recarga]);

  const reintentar = useCallback(() => {
    setCargando(true);
    setRecarga((n) => n + 1);
  }, []);

  const cab = detalle?.apartado ?? null;
  const estado = cab ? estadoVisible(cab) : null;
  const activo = cab?.estado === 'activo';
  const saldoCentavos = cab ? pesosACentavos(precioNumero(cab.saldo)) : 0;

  // ── Captura de pagos del abono (varios métodos) ──
  const limpiarErrorAbono = useCallback(() => setErrorAbono(null), []);
  const pagos = usePagosCombinados(saldoCentavos, {
    montoInicialCentavos: 0,
    onEditar: limpiarErrorAbono,
  });
  const abono = useMemo(() => resumirAbono(pagos.resumen), [pagos.resumen]);

  /** Abre la hoja de abono; con `liquidar` propone el saldo completo en efectivo. */
  const abrirAbono = useCallback(
    (liquidar = false) => {
      pagos.reiniciar(liquidar ? saldoCentavos : 0);
      setErrorAbono(null);
      setMensaje(null);
      setAbonoAbierto(true);
    },
    [pagos, saldoCentavos],
  );

  const cerrarAbono = useCallback(() => {
    if (!escribiendo.current) setAbonoAbierto(false);
  }, []);

  const puedeAbonar = activo && abono.valido && !enviandoAbono;

  const registrarAbono = useCallback(async () => {
    if (!puedeAbonar || escribiendo.current) return;
    escribiendo.current = true;
    setEnviandoAbono(true);
    setErrorAbono(null);

    const aplicados = aplicarCambio(pagos.pagos, pagos.resumen);
    // Pagos que ya no hay que enviar: registrados o consumidos por el cambio.
    const listos: number[] = [];
    let registrados = 0;
    let montoRegistrado = 0;
    let ultimo: AbonoResponse | null = null;
    let fallo: unknown = null;

    for (const { pago, centavos } of aplicados) {
      if (centavos <= 0) {
        listos.push(pago.id);
        continue;
      }
      try {
        ultimo = await apartadosRepository.abonar(id, {
          monto: centavosAPesos(centavos),
          metodo: pago.metodo,
        });
        listos.push(pago.id);
        registrados += 1;
        montoRegistrado += centavos;
      } catch (e) {
        fallo = e;
        break;
      }
    }

    const cambio = abono.cambioCentavos;
    if (fallo === null) {
      const partes = [
        registrados > 1
          ? `Se registraron ${registrados} abonos por ${formatPrecio(centavosAPesos(montoRegistrado))}.`
          : (ultimo?.message ?? 'Abono registrado.'),
      ];
      if (registrados > 1 && ultimo?.estado === 'completado') {
        partes.push('Apartado liquidado y listo para entrega.');
      }
      if (cambio > 0) partes.push(`Cambio a entregar: ${formatPrecio(centavosAPesos(cambio))}.`);
      setMensaje(partes.join(' '));
      setAbonoAbierto(false);
    } else {
      const motivo = mensajeDeError(fallo, 'No se pudo registrar el abono.');
      if (registrados > 0) {
        // Lo que sí entró ya no se vuelve a enviar; el saldo se recarga abajo.
        pagos.quitarPagos(listos);
        setErrorAbono(
          `Se registraron ${registrados} de ${aplicados.filter((a) => a.centavos > 0).length} pagos ` +
            `(${formatPrecio(centavosAPesos(montoRegistrado))}). El resto no se registró: ${motivo}`,
        );
      } else {
        // La hoja sigue abierta con todo lo capturado para reintentar.
        setErrorAbono(motivo);
      }
    }

    if (registrados > 0) setRecarga((n) => n + 1);
    escribiendo.current = false;
    setEnviandoAbono(false);
  }, [puedeAbonar, pagos, abono.cambioCentavos, id]);

  // ── Cancelar ──
  const pedirCancelacion = useCallback(() => {
    setMensaje(null);
    setConfirmarCancelacion(true);
  }, []);
  const noCancelar = useCallback(() => setConfirmarCancelacion(false), []);

  const cancelar = useCallback(async () => {
    if (!activo || escribiendo.current) return;
    escribiendo.current = true;
    setConfirmarCancelacion(false);
    setCancelando(true);
    try {
      const res = await apartadosRepository.cancelar(id);
      setMensaje(res.message);
      setError(null);
      setRecarga((n) => n + 1);
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo cancelar el apartado.'));
    } finally {
      escribiendo.current = false;
      setCancelando(false);
    }
  }, [activo, id]);

  return {
    // Datos
    cargando,
    error,
    reintentar,
    mensaje,
    cabecera: cab,
    articulos: detalle?.articulos ?? [],
    abonos: detalle?.abonos ?? [],
    estado,
    activo,
    total: cab ? precioNumero(cab.total) : 0,
    abonado: cab ? precioNumero(cab.abonado) : 0,
    saldo: centavosAPesos(saldoCentavos),

    // Abono / liquidación (uno o varios métodos)
    abonoAbierto,
    abrirAbono,
    cerrarAbono,
    pagos: pagos.pagos,
    activoId: pagos.activoId,
    activarPago: pagos.activarPago,
    agregarPago: pagos.agregarPago,
    actualizarPago: pagos.actualizarPago,
    quitarPago: pagos.quitarPago,
    sugerencias: pagos.sugerencias,
    montos: pagos.montos,
    erroresPago: pagos.resumen.erroresPago,
    errorPagos: abono.error,
    montoAbono: centavosAPesos(abono.abonoCentavos),
    cambio: centavosAPesos(abono.cambioCentavos),
    saldoRestante: centavosAPesos(abono.saldoRestanteCentavos),
    liquida: abono.liquida,
    puedeAbonar,
    enviandoAbono,
    errorAbono,
    registrarAbono,

    // Cancelación
    confirmarCancelacion,
    pedirCancelacion,
    noCancelar,
    cancelando,
    cancelar,
  };
}
