import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import { agruparPorProducto, type ProductoAgrupado, type VarianteBusqueda } from '@/data/models/venta';
import { ventasRepository } from '@/data/repositories/ventasRepository';

/** Milisegundos de espera tras la última tecla antes de disparar la petición. */
const DEBOUNCE_MS = 300;

/** Caracteres mínimos para disparar la búsqueda (evita golpear la API con 1 letra). */
const MIN_CHARS = 2;

export interface BuscarProductoViewModel {
  query: string;
  setQuery: (text: string) => void;
  /** Variantes crudas (una fila por talla/color). */
  resultados: VarianteBusqueda[];
  /** Mismas variantes agrupadas por nombre de producto, para la UI. */
  grupos: ProductoAgrupado[];
  loading: boolean;
  error: string | null;
  /** `true` si el usuario aún no escribe lo mínimo para buscar. */
  idle: boolean;
  /** Fuerza una nueva búsqueda con la query actual (reintentar tras error). */
  reintentar: () => void;
}

/**
 * ViewModel de búsqueda de productos (POS).
 *
 * - Debounce de 300 ms sobre `query`.
 * - Cancela toda petición previa con `AbortController` para que no gane
 *   una respuesta vieja a una más reciente.
 * - Pide mínimo 2 caracteres; con query vacía/corta devuelve lista vacía.
 */
export function useBuscarProductoViewModel(): BuscarProductoViewModel {
  const [query, setQueryState] = useState('');
  const [resultados, setResultados] = useState<VarianteBusqueda[]>([]);
  const [grupos, setGrupos] = useState<ProductoAgrupado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  // Guardamos el AbortController activo para poder cancelarlo cuando llega
  // una nueva query o se desmonta la pantalla.
  const activeController = useRef<AbortController | null>(null);

  /**
   * `setQuery` también limpia resultados/estado cuando la nueva query queda
   * por debajo del mínimo. Hacerlo aquí (en el evento del usuario, no dentro
   * del efecto) evita el anti-patrón `set-state-in-effect`.
   */
  const setQuery = useCallback((text: string) => {
    setQueryState(text);
    if (text.trim().length < MIN_CHARS) {
      activeController.current?.abort();
      activeController.current = null;
      setResultados([]);
      setGrupos([]);
      setError(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) return;

    // Cancelar cualquier búsqueda anterior.
    activeController.current?.abort();

    const controller = new AbortController();
    activeController.current = controller;

    // `setLoading(true)` también se dispara desde el timeout: así todos los
    // setState viven en callbacks asíncronos (regla set-state-in-effect).
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      ventasRepository
        .buscarProducto(trimmed, controller.signal)
        .then((variantes) => {
          if (controller.signal.aborted) return;
          setResultados(variantes);
          setGrupos(agruparPorProducto(variantes));
        })
        .catch((e: unknown) => {
          if ((e as { name?: string })?.name === 'AbortError') return;
          setError(e instanceof ApiError ? e.message : 'No se pudo buscar productos.');
          setResultados([]);
          setGrupos([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, reintento]);

  // Cancelar al desmontar (seguro extra sobre el cleanup del efecto).
  useEffect(
    () => () => {
      activeController.current?.abort();
    },
    [],
  );

  const reintentar = useCallback(() => setReintento((n) => n + 1), []);

  const idle = query.trim().length < MIN_CHARS;

  return { query, setQuery, resultados, grupos, loading, error, idle, reintentar };
}
