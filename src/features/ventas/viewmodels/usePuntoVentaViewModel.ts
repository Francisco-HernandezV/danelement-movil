import { router, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useCallback, useState } from 'react';

import type { ClienteBusqueda } from '@/data/models/cliente';
import type { VarianteBusqueda } from '@/data/models/venta';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';
import type { VentaCobrada } from './useCobroViewModel';

/**
 * Vistas del Punto de Venta:
 * - `venta`: cliente (opcional) + buscador + carrito, con "Cobrar" abajo;
 * - `pago`: formas de pago y confirmación del cobro;
 * - `confirmacion`: venta registrada (folio, cambio, desglose).
 */
export type ModoVenta = 'venta' | 'pago' | 'confirmacion';

/** Qué hoja de confirmación está abierta. */
type Confirmacion = { tipo: 'salir'; accion: NavigationAction } | { tipo: 'nueva' } | null;

/**
 * Lógica del Punto de Venta.
 *
 * - El carrito vive en `VentaEnCursoContext`; aquí se decide qué vista se
 *   muestra y se maneja la hoja de selección de cliente. El cliente es
 *   opcional: sin cliente, la venta se registra como de mostrador.
 * - Protege la venta en curso: cualquier intento de sacar la pantalla del
 *   stack (botón Salir, gesto de retroceso en iOS, botón atrás en Android,
 *   `router.replace`, etc.) se intercepta con `usePreventRemove` y se pide
 *   confirmación ("Seguir con la venta" / "Salir y descartar").
 * - El botón atrás de Android primero regresa de Pago a la venta
 *   (`retroceder`); solo desde la venta intenta salir.
 */
export function usePuntoVentaViewModel() {
  const venta = useVentaEnCurso();
  const navigation = useNavigation();

  const [modo, setModo] = useState<ModoVenta>('venta');
  const [ventaCobrada, setVentaCobrada] = useState<VentaCobrada | null>(null);
  const [confirmacion, setConfirmacion] = useState<Confirmacion>(null);
  const [selectorClienteAbierto, setSelectorClienteAbierto] = useState(false);

  const hayVentaEnCurso = !venta.isEmpty || venta.cliente !== null;
  // En la confirmación la venta ya se registró: salir no pierde nada.
  const debeConfirmarSalida = hayVentaEnCurso && modo !== 'confirmacion';

  // ── Cliente (opcional) ──
  const abrirSelectorCliente = useCallback(() => setSelectorClienteAbierto(true), []);
  const cerrarSelectorCliente = useCallback(() => setSelectorClienteAbierto(false), []);

  const elegirCliente = useCallback(
    (cliente: ClienteBusqueda) => {
      venta.seleccionarCliente(cliente);
      setSelectorClienteAbierto(false);
    },
    [venta],
  );

  /** Venta de mostrador: sin cliente (`cliente_id: null`). */
  const ventaDeMostrador = useCallback(() => {
    venta.quitarCliente();
    setSelectorClienteAbierto(false);
  }, [venta]);

  // ── Productos ──
  const agregarProducto = useCallback(
    (variante: VarianteBusqueda) => venta.agregarVariante(variante),
    [venta],
  );

  // ── Navegación entre vistas ──
  const irAPagar = useCallback(() => {
    if (!venta.isEmpty) setModo('pago');
  }, [venta.isEmpty]);

  const volverAVenta = useCallback(() => setModo('venta'), []);

  /** Atrás de Android. Devuelve `false` si no hay vista anterior (deja salir). */
  const retroceder = useCallback((): boolean => {
    if (modo === 'pago') {
      setModo('venta');
      return true;
    }
    return false;
  }, [modo]);

  // ── Cobro ──
  const onCobrada = useCallback((v: VentaCobrada) => {
    setVentaCobrada(v);
    setModo('confirmacion');
  }, []);

  /** "Nueva venta": tras cobrar empieza directo; con venta en curso, pregunta. */
  const nuevaVenta = useCallback(() => {
    if (modo === 'confirmacion' || !hayVentaEnCurso) {
      venta.nuevaVenta();
      setVentaCobrada(null);
      setModo('venta');
      return;
    }
    setConfirmacion({ tipo: 'nueva' });
  }, [modo, hayVentaEnCurso, venta]);

  // ── Salida protegida ──
  usePreventRemove(debeConfirmarSalida, ({ data }) => {
    setConfirmacion({ tipo: 'salir', accion: data.action });
  });

  /** Botón "Salir" del encabezado (la advertencia la dispara `usePreventRemove`). */
  const salir = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  /** "Seguir con la venta": cierra la hoja sin tocar nada. */
  const seguirConVenta = useCallback(() => setConfirmacion(null), []);

  /** "Salir y descartar" / "Descartar y empezar otra". */
  const descartar = useCallback(() => {
    const actual = confirmacion;
    setConfirmacion(null);
    venta.nuevaVenta();
    setVentaCobrada(null);
    setModo('venta');
    // La acción marcada por `usePreventRemove` ya no vuelve a bloquearse.
    if (actual?.tipo === 'salir') navigation.dispatch(actual.accion);
  }, [confirmacion, venta, navigation]);

  return {
    modo,
    irAPagar,
    volverAVenta,
    retroceder,

    // Venta en curso (lectura para la vista)
    cliente: venta.cliente,
    items: venta.items,
    totalItems: venta.totalItems,
    subtotal: venta.subtotal,
    carritoVacio: venta.isEmpty,
    hayVentaEnCurso,

    // Cliente
    selectorClienteAbierto,
    abrirSelectorCliente,
    cerrarSelectorCliente,
    elegirCliente,
    ventaDeMostrador,

    // Carrito
    agregarProducto,
    incrementar: venta.incrementar,
    decrementar: venta.decrementar,
    quitarItem: venta.quitarItem,

    // Cobro
    onCobrada,
    ventaCobrada,
    nuevaVenta,

    // Salida / descarte
    salir,
    confirmacion: confirmacion?.tipo ?? null,
    seguirConVenta,
    descartar,
  };
}
