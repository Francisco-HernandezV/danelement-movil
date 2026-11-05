import { router, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import {
  construirEntrada,
  erroresProductoLote,
  parseDinero,
  subtotalProductoLote,
  totalPiezas,
  type ProductoLote,
  type RegistrarEntradaResponse,
  type SugerenciaPrecio,
} from '@/data/models/inventario';
import { inventarioRepository } from '@/data/repositories/inventarioRepository';

const DEBOUNCE_SUGERENCIA_MS = 450;

function mensaje(e: unknown, porDefecto: string): string {
  return e instanceof ApiError ? e.message : porDefecto;
}

/** Celda que se está editando. */
interface CeldaActiva {
  productoId: number;
  clave: string;
}

/** Entrada registrada + datos congelados para la confirmación. */
export interface EntradaRegistrada extends RegistrarEntradaResponse {
  productos: number;
  piezas: number;
}

/**
 * Lógica de "Registrar entrada de mercancía".
 *
 * Flujo: captura (origen, productos con piezas por talla×color, costo y
 * precio) → resumen → registro. Reglas del backend que se respetan aquí:
 * - solo se capturan piezas en combinaciones que existen como variante;
 * - costo unitario ≥ 0 y precio de venta > 0 por producto;
 * - el precio nuevo se aplica a TODAS las variantes del producto.
 *
 * El precio sugerido lo calcula el backend (`calcular-sugerencia`, costo
 * promedio ponderado × margen) con debounce; si el precio aún está vacío se
 * precarga con la sugerencia. Salir con un lote capturado pide confirmación.
 */
export function useRegistrarEntradaViewModel() {
  const navigation = useNavigation();

  const [modo, setModo] = useState<'captura' | 'resumen'>('captura');
  const [origen, setOrigen] = useState('');
  const [nota, setNota] = useState('');
  const [lote, setLote] = useState<ProductoLote[]>([]);
  const [productoActivoId, setProductoActivoId] = useState<number | null>(null);
  const [celdaActiva, setCeldaActiva] = useState<CeldaActiva | null>(null);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [errorAgregar, setErrorAgregar] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<Record<number, SugerenciaPrecio | null>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrada, setRegistrada] = useState<EntradaRegistrada | null>(null);
  const [quitarPendiente, setQuitarPendiente] = useState<number | null>(null);
  const [salidaPendiente, setSalidaPendiente] = useState<NavigationAction | null>(null);
  const enviandoRef = useRef(false);

  const actualizarProducto = useCallback((id: number, cambio: (p: ProductoLote) => ProductoLote) => {
    setLote((prev) => prev.map((p) => (p.matriz.producto.id === id ? cambio(p) : p)));
    setError(null);
  }, []);

  // ── Productos del lote ──
  const abrirSelector = useCallback(() => {
    setErrorAgregar(null);
    setSelectorAbierto(true);
  }, []);
  const cerrarSelector = useCallback(() => setSelectorAbierto(false), []);

  /** Agrega un producto (carga su matriz) y lo deja abierto para capturar. */
  const agregarProducto = useCallback(
    async (productoId: number) => {
      if (lote.some((p) => p.matriz.producto.id === productoId)) {
        setSelectorAbierto(false);
        setProductoActivoId(productoId);
        return;
      }
      setAgregando(true);
      setErrorAgregar(null);
      try {
        const matriz = await inventarioRepository.matriz(productoId);
        if (matriz.variantes.length === 0) {
          setErrorAgregar('Este producto no tiene variantes activas: agrégalas desde la web primero.');
          return;
        }
        setLote((prev) => [...prev, { matriz, celdas: {}, costoTexto: '', precioTexto: '' }]);
        setProductoActivoId(productoId);
        setCeldaActiva(null);
        setSelectorAbierto(false);
      } catch (e) {
        setErrorAgregar(mensaje(e, 'No se pudo cargar la matriz del producto.'));
      } finally {
        setAgregando(false);
      }
    },
    [lote],
  );

  const activarProducto = useCallback((id: number) => {
    setProductoActivoId((actual) => (actual === id ? null : id));
    setCeldaActiva(null);
  }, []);

  /** Quitar: si ya tiene piezas capturadas, pide confirmación. */
  const pedirQuitarProducto = useCallback(
    (id: number) => {
      const p = lote.find((x) => x.matriz.producto.id === id);
      if (p && totalPiezas(p.celdas) > 0) setQuitarPendiente(id);
      else {
        setLote((prev) => prev.filter((x) => x.matriz.producto.id !== id));
        if (productoActivoId === id) setProductoActivoId(null);
      }
    },
    [lote, productoActivoId],
  );
  const cancelarQuitar = useCallback(() => setQuitarPendiente(null), []);
  const confirmarQuitar = useCallback(() => {
    const id = quitarPendiente;
    setQuitarPendiente(null);
    if (id === null) return;
    setLote((prev) => prev.filter((x) => x.matriz.producto.id !== id));
    if (productoActivoId === id) setProductoActivoId(null);
    if (celdaActiva?.productoId === id) setCeldaActiva(null);
  }, [quitarPendiente, productoActivoId, celdaActiva]);

  // ── Celdas ──
  const seleccionarCelda = useCallback((productoId: number, clave: string) => {
    setCeldaActiva((actual) =>
      actual && actual.productoId === productoId && actual.clave === clave ? null : { productoId, clave },
    );
  }, []);

  const fijarCantidad = useCallback(
    (cantidad: number) => {
      if (!celdaActiva) return;
      const n = Math.max(0, Math.min(9999, Math.floor(cantidad)));
      actualizarProducto(celdaActiva.productoId, (p) => {
        const celdas = { ...p.celdas };
        if (n > 0) celdas[celdaActiva.clave] = n;
        else delete celdas[celdaActiva.clave];
        return { ...p, celdas };
      });
    },
    [celdaActiva, actualizarProducto],
  );

  /** Texto del input de cantidad (solo enteros). */
  const cambiarCantidadTexto = useCallback(
    (texto: string) => {
      const limpio = texto.replace(/\D/g, '');
      fijarCantidad(limpio.length === 0 ? 0 : Number(limpio));
    },
    [fijarCantidad],
  );

  const cantidadActiva = useMemo(() => {
    if (!celdaActiva) return 0;
    const p = lote.find((x) => x.matriz.producto.id === celdaActiva.productoId);
    return p?.celdas[celdaActiva.clave] ?? 0;
  }, [celdaActiva, lote]);

  const incrementar = useCallback(() => fijarCantidad(cantidadActiva + 1), [fijarCantidad, cantidadActiva]);
  const decrementar = useCallback(() => fijarCantidad(cantidadActiva - 1), [fijarCantidad, cantidadActiva]);

  // ── Costo, precio y sugerencia ──
  const cambiarCosto = useCallback(
    (id: number, t: string) => actualizarProducto(id, (p) => ({ ...p, costoTexto: t })),
    [actualizarProducto],
  );
  const cambiarPrecio = useCallback(
    (id: number, t: string) => actualizarProducto(id, (p) => ({ ...p, precioTexto: t })),
    [actualizarProducto],
  );
  const usarSugerido = useCallback(
    (id: number) => {
      const s = sugerencias[id];
      if (s) actualizarProducto(id, (p) => ({ ...p, precioTexto: s.precio_sugerido.toFixed(2) }));
    },
    [sugerencias, actualizarProducto],
  );

  // Firma de lo que afecta la sugerencia: producto, piezas y costo.
  const firmaSugerencia = lote
    .map((p) => `${p.matriz.producto.id}:${totalPiezas(p.celdas)}:${parseDinero(p.costoTexto) ?? ''}`)
    .join('|');

  useEffect(() => {
    const pedir = lote
      .map((p) => ({
        id: p.matriz.producto.id,
        piezas: totalPiezas(p.celdas),
        costo: parseDinero(p.costoTexto),
      }))
      .filter((x): x is { id: number; piezas: number; costo: number } => x.piezas > 0 && x.costo !== null && x.costo > 0);
    if (pedir.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      for (const x of pedir) {
        inventarioRepository
          .calcularSugerencia(
            { producto_id: x.id, total_piezas: x.piezas, costo_unitario: x.costo },
            controller.signal,
          )
          .then((s) => {
            if (controller.signal.aborted) return;
            setSugerencias((prev) => ({ ...prev, [x.id]: s }));
            // Si aún no hay precio capturado, se precarga con el sugerido.
            setLote((prev) =>
              prev.map((p) =>
                p.matriz.producto.id === x.id && p.precioTexto.trim() === ''
                  ? { ...p, precioTexto: s.precio_sugerido.toFixed(2) }
                  : p,
              ),
            );
          })
          .catch(() => {
            // Sin sugerencia el usuario captura el precio a mano; no bloquea.
          });
      }
    }, DEBOUNCE_SUGERENCIA_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `firmaSugerencia` resume `lote` en lo que importa para no repetir
    // consultas al cambiar solo el precio o la celda seleccionada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaSugerencia]);

  // ── Totales y validación ──
  const resumen = useMemo(() => {
    const productos = lote.map((p) => ({
      id: p.matriz.producto.id,
      nombre: p.matriz.producto.nombre,
      piezas: totalPiezas(p.celdas),
      costo: parseDinero(p.costoTexto) ?? 0,
      precioNuevo: parseDinero(p.precioTexto) ?? 0,
      precioActual: p.matriz.producto.precio_base,
      subtotal: subtotalProductoLote(p),
      errores: erroresProductoLote(p),
    }));
    return {
      productos,
      piezas: productos.reduce((s, p) => s + p.piezas, 0),
      total: productos.reduce((s, p) => s + p.subtotal, 0),
      listo: productos.length > 0 && productos.every((p) => p.errores.length === 0),
    };
  }, [lote]);

  const irAResumen = useCallback(() => {
    if (resumen.listo) {
      setCeldaActiva(null);
      setModo('resumen');
    }
  }, [resumen.listo]);
  const volverACaptura = useCallback(() => setModo('captura'), []);
  /** Atrás de Android: de resumen regresa a la captura. */
  const retroceder = useCallback((): boolean => {
    if (modo === 'resumen' && registrada === null) {
      setModo('captura');
      return true;
    }
    return false;
  }, [modo, registrada]);

  const registrar = useCallback(async () => {
    if (!resumen.listo || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setError(null);
    try {
      const res = await inventarioRepository.registrarEntrada(construirEntrada(origen, nota, lote));
      setRegistrada({ ...res, productos: resumen.productos.length, piezas: resumen.piezas });
    } catch (e) {
      // Se conserva todo lo capturado para reintentar.
      setError(mensaje(e, 'No se pudo registrar la entrada.'));
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [resumen, origen, nota, lote]);

  const nuevaEntrada = useCallback(() => {
    setLote([]);
    setOrigen('');
    setNota('');
    setSugerencias({});
    setRegistrada(null);
    setProductoActivoId(null);
    setCeldaActiva(null);
    setModo('captura');
  }, []);

  // ── Salida protegida ──
  const hayDatos =
    registrada === null && (lote.length > 0 || origen.trim().length > 0 || nota.trim().length > 0);
  usePreventRemove(hayDatos, ({ data }) => setSalidaPendiente(data.action));

  const salir = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin/inventario');
  }, []);
  const seguirCapturando = useCallback(() => setSalidaPendiente(null), []);
  const descartarYSalir = useCallback(() => {
    const accion = salidaPendiente;
    setSalidaPendiente(null);
    setLote([]);
    setOrigen('');
    setNota('');
    if (accion) navigation.dispatch(accion);
  }, [salidaPendiente, navigation]);

  return {
    modo,
    irAResumen,
    volverACaptura,
    retroceder,

    // Cabecera
    origen,
    setOrigen,
    nota,
    setNota,

    // Lote
    lote,
    productoActivoId,
    activarProducto,
    selectorAbierto,
    abrirSelector,
    cerrarSelector,
    agregarProducto,
    agregando,
    errorAgregar,
    pedirQuitarProducto,
    quitarPendiente: quitarPendiente !== null,
    cancelarQuitar,
    confirmarQuitar,

    // Celdas
    celdaActiva,
    seleccionarCelda,
    cantidadActiva,
    cambiarCantidadTexto,
    incrementar,
    decrementar,

    // Costo / precio
    cambiarCosto,
    cambiarPrecio,
    sugerencias,
    usarSugerido,

    // Totales
    resumen,

    // Registro
    enviando,
    error,
    registrar,
    registrada,
    nuevaEntrada,
    verHistorial: () => router.replace('/admin/inventario/entradas'),

    // Salida
    salir,
    confirmarSalida: salidaPendiente !== null,
    seguirCapturando,
    descartarYSalir,
  };
}
