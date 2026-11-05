import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { EntradaResumen } from '@/data/models/inventario';
import { inventarioRepository } from '@/data/repositories/inventarioRepository';

/** Historial de entradas de mercancía (últimas 100), con recarga al volver. */
export function useHistorialEntradasViewModel() {
  const [entradas, setEntradas] = useState<EntradaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    inventarioRepository
      .entradas(controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setEntradas(rows);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el historial.');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setCargando(false);
        setRefrescando(false);
      });
    return () => controller.abort();
  }, [recarga]);

  // Al volver (p. ej. tras anular), no en el primer foco.
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

  const refrescar = useCallback(() => {
    setRefrescando(true);
    setRecarga((n) => n + 1);
  }, []);
  const reintentar = useCallback(() => {
    setCargando(true);
    setRecarga((n) => n + 1);
  }, []);

  return {
    entradas,
    cargando,
    refrescando,
    error,
    refrescar,
    reintentar,
    abrir: (id: number) =>
      router.push({ pathname: '/admin/inventario/entradas/[id]', params: { id: String(id) } }),
    nueva: () => router.push('/admin/inventario/entrada'),
    volver: () => (router.canGoBack() ? router.back() : router.replace('/admin/inventario')),
  };
}
