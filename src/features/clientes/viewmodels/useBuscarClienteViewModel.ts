import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { ClienteBusqueda } from '@/data/models/cliente';
import { ventasRepository } from '@/data/repositories/ventasRepository';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export interface BuscarClienteViewModel {
  query: string;
  setQuery: (text: string) => void;
  resultados: ClienteBusqueda[];
  loading: boolean;
  error: string | null;
  /** `true` si el usuario aún no escribe lo mínimo para buscar. */
  idle: boolean;
  reintentar: () => void;
}

/**
 * ViewModel de búsqueda de clientes (POS).
 *
 * Mismo patrón que `useBuscarProductoViewModel`: debounce 300ms, cancelación
 * con `AbortController`, mínimo 2 caracteres, y limpieza de estado hecha en
 * el handler del cambio (no dentro del `useEffect`) para no romper la regla
 * `set-state-in-effect`.
 */
export function useBuscarClienteViewModel(): BuscarClienteViewModel {
  const [query, setQueryState] = useState('');
  const [resultados, setResultados] = useState<ClienteBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  const activeController = useRef<AbortController | null>(null);

  const setQuery = useCallback((text: string) => {
    setQueryState(text);
    if (text.trim().length < MIN_CHARS) {
      activeController.current?.abort();
      activeController.current = null;
      setResultados([]);
      setError(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) return;

    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      ventasRepository
        .buscarCliente(trimmed, controller.signal)
        .then((lista) => {
          if (controller.signal.aborted) return;
          setResultados(lista);
        })
        .catch((e: unknown) => {
          if ((e as { name?: string })?.name === 'AbortError') return;
          setError(e instanceof ApiError ? e.message : 'No se pudo buscar clientes.');
          setResultados([]);
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

  useEffect(
    () => () => {
      activeController.current?.abort();
    },
    [],
  );

  const reintentar = useCallback(() => setReintento((n) => n + 1), []);
  const idle = query.trim().length < MIN_CHARS;

  return { query, setQuery, resultados, loading, error, idle, reintentar };
}
