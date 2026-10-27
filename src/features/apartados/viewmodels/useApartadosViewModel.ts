import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { ApartadoResumen, FiltroApartado } from '@/data/models/apartado';
import { apartadosRepository } from '@/data/repositories/apartadosRepository';

const DEBOUNCE_MS = 300;

/**
 * Lógica de la lista de Apartados.
 *
 * - Filtro por estado (por defecto "Activos") y búsqueda por folio, nombre o
 *   teléfono del cliente con debounce de 300 ms.
 * - Cancela la petición anterior con `AbortController` para que una respuesta
 *   vieja no pise a una más reciente.
 * - Se recarga al volver a la pantalla (p. ej. tras crear o abonar).
 * - Todos los `setState` del efecto viven en callbacks asíncronos (regla
 *   `react-hooks/set-state-in-effect`).
 */
export function useApartadosViewModel() {
  const [filtro, setFiltroState] = useState<FiltroApartado>('activo');
  const [query, setQueryState] = useState('');
  const [apartados, setApartados] = useState<ApartadoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  // La búsqueda espera al debounce; filtro y recargas van de inmediato.
  const esperar = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setError(null);
      apartadosRepository
        .listar(filtro, query, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) setApartados(rows);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
          setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los apartados.');
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setCargando(false);
          setRefrescando(false);
        });
    }, esperar.current);
    esperar.current = 0;

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filtro, query, recarga]);

  // Al volver a la pantalla (no en el primer foco: ya cargó el efecto).
  const primerFoco = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primerFoco.current) {
        primerFoco.current = false;
        return;
      }
      setRecarga((n) => n + 1);
    }, []),
  );

  const setFiltro = useCallback((f: FiltroApartado) => {
    setFiltroState(f);
    setCargando(true);
  }, []);

  const setQuery = useCallback((texto: string) => {
    esperar.current = DEBOUNCE_MS;
    setQueryState(texto);
  }, []);

  /** Pull-to-refresh. */
  const refrescar = useCallback(() => {
    setRefrescando(true);
    setRecarga((n) => n + 1);
  }, []);

  const reintentar = useCallback(() => {
    setCargando(true);
    setRecarga((n) => n + 1);
  }, []);

  const abrir = useCallback((id: number) => {
    router.push({ pathname: '/apartados/[id]', params: { id: String(id) } });
  }, []);

  const nuevo = useCallback(() => router.push('/apartados/nuevo'), []);

  return {
    filtro,
    setFiltro,
    query,
    setQuery,
    apartados,
    cargando,
    refrescando,
    error,
    refrescar,
    reintentar,
    abrir,
    nuevo,
  };
}
