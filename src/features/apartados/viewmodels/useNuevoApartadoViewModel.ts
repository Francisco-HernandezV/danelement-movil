import { router, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { EstadoApartado } from '@/data/models/apartado';
import type { ClienteBusqueda } from '@/data/models/cliente';
import { formatPrecio } from '@/data/models/producto';
import type { MetodoPago, VarianteBusqueda } from '@/data/models/venta';
import { apartadosRepository } from '@/data/repositories/apartadosRepository';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';
import {
  aplicarCambio,
  centavosAPesos,
  pesosACentavos,
} from '@/features/ventas/viewmodels/cobroCalculo';
import { usePagosCombinados } from '@/features/ventas/viewmodels/usePagosCombinados';
import { resumirAnticipo } from './apartadoCalculo';

function mensajeDeError(e: unknown, porDefecto: string): string {
  return e instanceof ApiError ? e.message : porDefecto;
}

/** Apartado recién creado + datos congelados para la confirmación. */
export interface ApartadoCreado {
  apartadoId: number;
  fechaLimite: string;
  clienteNombre: string;
  total: number;
  /** Anticipo que SÍ quedó registrado (suma de los pagos aplicados). */
  abonado: number;
  saldo: number;
  estado: EstadoApartado;
  /** Desglose del anticipo registrado (monto aplicado por método). */
  pagos: { metodo: MetodoPago; monto: number }[];
  cambio: number;
  /** Si algún pago del anticipo no se pudo registrar después de crear. */
  aviso: string | null;
}

/**
 * Lógica de "Nuevo apartado".
 *
 * - El carrito vive en un `VentaEnCursoProvider` PROPIO de esta pantalla
 *   (ver la ruta `apartados/nuevo`), así no se mezcla con la venta del POS.
 * - El cliente es OBLIGATORIO (el backend lo exige).
 * - ANTICIPO OPCIONAL CON UNO O VARIOS MÉTODOS: la captura reutiliza
 *   `usePagosCombinados` con el total como referencia (el efectivo puede dar
 *   cambio). El backend recibe un solo anticipo al crear
 *   (`anticipo` + `metodo_anticipo`), así que se envía el PRIMER pago como
 *   anticipo y los demás como abonos inmediatamente después
 *   (`POST /apartados/:id/abonos`). Si entre todos cubren el total, el último
 *   abono liquida y entrega. No es atómico: si un abono posterior falla, el
 *   apartado ya existe con lo que sí entró y se avisa en la confirmación.
 * - Protege lo capturado: salir con datos pide confirmación (`usePreventRemove`).
 */
export function useNuevoApartadoViewModel() {
  const venta = useVentaEnCurso();
  const navigation = useNavigation();

  /** `captura`: cliente + carrito. `anticipo`: anticipo, saldo y registrar. */
  const [modo, setModo] = useState<'captura' | 'anticipo'>('captura');
  const [selectorClienteAbierto, setSelectorClienteAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<ApartadoCreado | null>(null);
  const [salidaPendiente, setSalidaPendiente] = useState<NavigationAction | null>(null);
  const enviandoRef = useRef(false);

  const totalCentavos = pesosACentavos(venta.subtotal);

  // ── Anticipo (uno o varios métodos) ──
  const limpiarError = useCallback(() => setError(null), []);
  const pagos = usePagosCombinados(totalCentavos, {
    montoInicialCentavos: 0,
    onEditar: limpiarError,
  });
  const sinMontos = pagos.pagos.every((p) => p.montoTexto.trim().length === 0);
  const anticipo = useMemo(
    () => resumirAnticipo(pagos.resumen, sinMontos),
    [pagos.resumen, sinMontos],
  );

  const hayDatos = !venta.isEmpty || venta.cliente !== null || !sinMontos;
  const puedeContinuar = venta.cliente !== null && !venta.isEmpty;
  const puedeRegistrar = puedeContinuar && anticipo.valido && !enviando;

  // ── Vistas ──
  const irAAnticipo = useCallback(() => {
    if (puedeContinuar) setModo('anticipo');
  }, [puedeContinuar]);
  const volverACaptura = useCallback(() => setModo('captura'), []);
  /** Atrás de Android: de anticipo regresa a la captura; si no, deja salir. */
  const retroceder = useCallback((): boolean => {
    if (modo === 'anticipo' && creado === null) {
      setModo('captura');
      return true;
    }
    return false;
  }, [modo, creado]);

  // ── Cliente ──
  const abrirSelectorCliente = useCallback(() => setSelectorClienteAbierto(true), []);
  const cerrarSelectorCliente = useCallback(() => setSelectorClienteAbierto(false), []);
  const elegirCliente = useCallback(
    (c: ClienteBusqueda) => {
      venta.seleccionarCliente(c);
      setSelectorClienteAbierto(false);
      setError(null);
    },
    [venta],
  );

  // ── Productos ──
  const agregarProducto = useCallback(
    (v: VarianteBusqueda) => venta.agregarVariante(v),
    [venta],
  );

  // ── Atajos del anticipo ──
  const sinAnticipo = useCallback(() => {
    pagos.reiniciar(0);
    setError(null);
  }, [pagos]);
  const anticipoTotal = useCallback(() => {
    pagos.reiniciar(totalCentavos);
    setError(null);
  }, [pagos, totalCentavos]);

  // ── Registrar ──
  const registrar = useCallback(async () => {
    if (!puedeRegistrar || !venta.cliente || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);

    const cliente = venta.cliente;
    // Montos aplicados por pago (cambio ya descontado del efectivo).
    const aplicados = sinMontos
      ? []
      : aplicarCambio(pagos.pagos, pagos.resumen).filter((a) => a.centavos > 0);
    const [primero, ...resto] = aplicados;

    // 1) Crear el apartado con el primer pago como anticipo.
    let creadoRes;
    try {
      creadoRes = await apartadosRepository.crear({
        cliente_id: cliente.id,
        items: venta.items.map((it) => ({ variante_id: it.variante_id, cantidad: it.cantidad })),
        anticipo: primero ? centavosAPesos(primero.centavos) : 0,
        metodo_anticipo: primero ? primero.pago.metodo : 'Efectivo',
      });
    } catch (e) {
      // No se creó nada: se conserva todo lo capturado para reintentar.
      setError(mensajeDeError(e, 'No se pudo registrar el apartado.'));
      enviandoRef.current = false;
      setEnviando(false);
      return;
    }

    // 2) Los demás pagos del anticipo, como abonos (uno a la vez).
    const registrados = primero
      ? [{ metodo: primero.pago.metodo, monto: centavosAPesos(primero.centavos) }]
      : [];
    let abonadoCentavos = primero?.centavos ?? 0;
    let estado: EstadoApartado = creadoRes.estado;
    let aviso: string | null = null;

    for (let i = 0; i < resto.length; i++) {
      const { pago, centavos } = resto[i];
      try {
        const r = await apartadosRepository.abonar(creadoRes.apartado_id, {
          monto: centavosAPesos(centavos),
          metodo: pago.metodo,
        });
        registrados.push({ metodo: pago.metodo, monto: centavosAPesos(centavos) });
        abonadoCentavos += centavos;
        estado = r.estado;
      } catch (e) {
        const faltante = resto.slice(i).reduce((s, a) => s + a.centavos, 0);
        aviso =
          `No se registraron ${resto.length - i} pago(s) del anticipo ` +
          `(${formatPrecio(centavosAPesos(faltante))}): ${mensajeDeError(e, 'error desconocido')}. ` +
          'Regístralos como abono desde el detalle del apartado.';
        break;
      }
    }

    venta.nuevaVenta();
    pagos.reiniciar(0);
    setCreado({
      apartadoId: creadoRes.apartado_id,
      fechaLimite: creadoRes.fecha_limite,
      clienteNombre: cliente.nombre?.trim() || 'Cliente sin nombre',
      total: centavosAPesos(totalCentavos),
      abonado: centavosAPesos(abonadoCentavos),
      saldo: centavosAPesos(Math.max(0, totalCentavos - abonadoCentavos)),
      estado,
      pagos: registrados,
      // El cambio solo se entrega si todo el anticipo quedó registrado.
      cambio: aviso ? 0 : centavosAPesos(anticipo.cambioCentavos),
      aviso,
    });
    enviandoRef.current = false;
    setEnviando(false);
  }, [puedeRegistrar, venta, sinMontos, pagos, totalCentavos, anticipo.cambioCentavos]);

  // ── Después de crear ──
  const verApartado = useCallback(() => {
    if (!creado) return;
    router.replace({ pathname: '/apartados/[id]', params: { id: String(creado.apartadoId) } });
  }, [creado]);

  const otroApartado = useCallback(() => {
    venta.nuevaVenta();
    pagos.reiniciar(0);
    setCreado(null);
    setModo('captura');
  }, [venta, pagos]);

  // ── Salida protegida ──
  usePreventRemove(hayDatos && creado === null, ({ data }) => setSalidaPendiente(data.action));

  const salir = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/apartados');
  }, []);
  const seguirCapturando = useCallback(() => setSalidaPendiente(null), []);
  const descartarYSalir = useCallback(() => {
    const accion = salidaPendiente;
    setSalidaPendiente(null);
    venta.nuevaVenta();
    pagos.reiniciar(0);
    if (accion) navigation.dispatch(accion);
  }, [salidaPendiente, venta, pagos, navigation]);

  return {
    // Vistas
    modo,
    puedeContinuar,
    irAAnticipo,
    volverACaptura,
    retroceder,

    // Cliente
    cliente: venta.cliente,
    selectorClienteAbierto,
    abrirSelectorCliente,
    cerrarSelectorCliente,
    elegirCliente,
    quitarCliente: venta.quitarCliente,

    // Carrito
    items: venta.items,
    totalItems: venta.totalItems,
    carritoVacio: venta.isEmpty,
    agregarProducto,
    incrementar: venta.incrementar,
    decrementar: venta.decrementar,
    quitarItem: venta.quitarItem,

    // Anticipo (uno o varios métodos)
    pagos: pagos.pagos,
    activoId: pagos.activoId,
    activarPago: pagos.activarPago,
    agregarPago: pagos.agregarPago,
    actualizarPago: pagos.actualizarPago,
    quitarPago: pagos.quitarPago,
    sugerencias: pagos.sugerencias,
    montos: pagos.montos,
    erroresPago: pagos.resumen.erroresPago,
    errorPagos: anticipo.error,
    sinAnticipo,
    anticipoTotal,
    liquidaEnElActo: anticipo.liquida,

    // Totales (pesos)
    total: centavosAPesos(totalCentavos),
    anticipo: centavosAPesos(anticipo.abonoCentavos),
    cambio: centavosAPesos(anticipo.cambioCentavos),
    saldo: centavosAPesos(anticipo.saldoRestanteCentavos),

    // Registro
    puedeRegistrar,
    enviando,
    error,
    registrar,
    creado,
    verApartado,
    otroApartado,

    // Salida
    salir,
    confirmarSalida: salidaPendiente !== null,
    seguirCapturando,
    descartarYSalir,
  };
}
