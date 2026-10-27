import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { ProductoInventario } from '@/data/models/inventario';
import { inventarioRepository } from '@/data/repositories/inventarioRepository';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

/**
 * Búsqueda de mercancía (productos, no variantes) para el administrador.
 *
 * - Debounce de 300 ms y mínimo 2 caracteres (igual que el backend).
 * - Cancela la petición anterior con `AbortController`.
 * - La limpieza al borrar la búsqueda vive en `setQuery` (evento del usuario),
 *   no en el efecto: regla `react-hooks/set-state-in-effect`.
 */
export function useBuscarMercanciaViewModel() {
  const [query, setQueryState] = useState('');
  const [resultados, setResultados] = useState<ProductoInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);
  const activo = useRef<AbortController | null>(null);

  const setQuery = useCallback((texto: string) => {
    setQueryState(texto);
    if (texto.trim().length < MIN_CHARS) {
      activo.current?.abort();
      activo.current = null;
      setResultados([]);
      setError(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) return;
    activo.current?.abort();
    const controller = new AbortController();
    activo.current = controller;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      inventarioRepository
        .buscarProducto(q, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) setResultados(rows);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
          setError(e instanceof ApiError ? e.message : 'No se pudo buscar la mercancía.');
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

  useEffect(() => () => activo.current?.abort(), []);

  const reintentar = useCallback(() => setReintento((n) => n + 1), []);

  return {
    query,
    setQuery,
    resultados,
    loading,
    error,
    idle: query.trim().length < MIN_CHARS,
    reintentar,
    abrir: (id: number) =>
      router.push({ pathname: '/admin/inventario/producto/[id]', params: { id: String(id) } }),
    irAEntrada: () => router.push('/admin/inventario/entrada'),
    irAHistorial: () => router.push('/admin/inventario/entradas'),
    volver: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
  };
}
