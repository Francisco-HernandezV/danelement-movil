import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import type { ClienteBusqueda } from '@/data/models/cliente';
import type { VarianteBusqueda } from '@/data/models/venta';
import { precioVariante } from '@/data/models/venta';

/** Un ítem agregado al carrito de la venta en curso. */
export interface VentaItem {
  variante_id: number;
  producto_nombre: string;
  talla: string;
  color: string;
  sku: string;
  precio_unitario: number;
  stock_disponible: number;
  cantidad: number;
}

interface VentaState {
  cliente: ClienteBusqueda | null;
  /** Venta de mostrador: el vendedor eligió explícitamente ir sin cliente. */
  sinCliente: boolean;
  items: VentaItem[];
}

type VentaAction =
  | { type: 'setCliente'; cliente: ClienteBusqueda }
  | { type: 'clearCliente' }
  | { type: 'sinCliente' }
  | { type: 'addVariante'; variante: VarianteBusqueda }
  | { type: 'inc'; variante_id: number }
  | { type: 'dec'; variante_id: number }
  | { type: 'remove'; variante_id: number }
  | { type: 'reset' };

const INITIAL: VentaState = { cliente: null, sinCliente: false, items: [] };

function reducer(state: VentaState, action: VentaAction): VentaState {
  switch (action.type) {
    case 'setCliente':
      return { ...state, cliente: action.cliente, sinCliente: false };
    case 'clearCliente':
      return { ...state, cliente: null, sinCliente: false };
    case 'sinCliente':
      return { ...state, cliente: null, sinCliente: true };
    case 'addVariante': {
      const v = action.variante;
      const existente = state.items.find((it) => it.variante_id === v.variante_id);
      if (existente) {
        // Si ya está, sumamos 1 sin pasar del stock disponible.
        if (existente.cantidad >= existente.stock_disponible) return state;
        return {
          ...state,
          items: state.items.map((it) =>
            it.variante_id === v.variante_id ? { ...it, cantidad: it.cantidad + 1 } : it,
          ),
        };
      }
      const nuevo: VentaItem = {
        variante_id: v.variante_id,
        producto_nombre: v.producto_nombre,
        talla: v.talla,
        color: v.color,
        sku: v.sku,
        precio_unitario: precioVariante(v),
        stock_disponible: Number(v.stock_disponible ?? 0),
        cantidad: 1,
      };
      return { ...state, items: [...state.items, nuevo] };
    }
    case 'inc':
      return {
        ...state,
        items: state.items.map((it) =>
          it.variante_id === action.variante_id && it.cantidad < it.stock_disponible
            ? { ...it, cantidad: it.cantidad + 1 }
            : it,
        ),
      };
    case 'dec':
      return {
        ...state,
        items: state.items
          .map((it) =>
            it.variante_id === action.variante_id ? { ...it, cantidad: it.cantidad - 1 } : it,
          )
          .filter((it) => it.cantidad > 0),
      };
    case 'remove':
      return {
        ...state,
        items: state.items.filter((it) => it.variante_id !== action.variante_id),
      };
    case 'reset':
      return INITIAL;
    default:
      return state;
  }
}

interface VentaEnCursoValue extends VentaState {
  subtotal: number;
  totalItems: number;
  isEmpty: boolean;
  seleccionarCliente: (cliente: ClienteBusqueda) => void;
  continuarSinCliente: () => void;
  quitarCliente: () => void;
  agregarVariante: (variante: VarianteBusqueda) => void;
  incrementar: (variante_id: number) => void;
  decrementar: (variante_id: number) => void;
  quitarItem: (variante_id: number) => void;
  nuevaVenta: () => void;
}

const Ctx = createContext<VentaEnCursoValue | undefined>(undefined);

/**
 * Mantiene el estado de la venta POS en curso (cliente + items).
 *
 * Vive bajo `app/(vendedor)/_layout.tsx` para que las pantallas de búsqueda
 * y la pantalla principal del POS compartan el mismo estado sin pasar props.
 * No se persiste: la venta en curso solo vive en memoria.
 */
export function VentaEnCursoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const seleccionarCliente = useCallback(
    (cliente: ClienteBusqueda) => dispatch({ type: 'setCliente', cliente }),
    [],
  );
  const continuarSinCliente = useCallback(() => dispatch({ type: 'sinCliente' }), []);
  const quitarCliente = useCallback(() => dispatch({ type: 'clearCliente' }), []);
  const agregarVariante = useCallback(
    (variante: VarianteBusqueda) => dispatch({ type: 'addVariante', variante }),
    [],
  );
  const incrementar = useCallback(
    (variante_id: number) => dispatch({ type: 'inc', variante_id }),
    [],
  );
  const decrementar = useCallback(
    (variante_id: number) => dispatch({ type: 'dec', variante_id }),
    [],
  );
  const quitarItem = useCallback(
    (variante_id: number) => dispatch({ type: 'remove', variante_id }),
    [],
  );
  const nuevaVenta = useCallback(() => dispatch({ type: 'reset' }), []);

  const subtotal = useMemo(
    () => state.items.reduce((sum, it) => sum + it.precio_unitario * it.cantidad, 0),
    [state.items],
  );
  const totalItems = useMemo(
    () => state.items.reduce((sum, it) => sum + it.cantidad, 0),
    [state.items],
  );

  const value = useMemo<VentaEnCursoValue>(
    () => ({
      ...state,
      subtotal,
      totalItems,
      isEmpty: state.items.length === 0,
      seleccionarCliente,
      continuarSinCliente,
      quitarCliente,
      agregarVariante,
      incrementar,
      decrementar,
      quitarItem,
      nuevaVenta,
    }),
    [
      state,
      subtotal,
      totalItems,
      seleccionarCliente,
      continuarSinCliente,
      quitarCliente,
      agregarVariante,
      incrementar,
      decrementar,
      quitarItem,
      nuevaVenta,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVentaEnCurso(): VentaEnCursoValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useVentaEnCurso debe usarse dentro de <VentaEnCursoProvider>.');
  }
  return ctx;
}
