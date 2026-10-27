import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/config/http';
import {
  indiceVariantes,
  ordenarTallas,
  type MatrizVariantes,
} from '@/data/models/inventario';
import { inventarioRepository } from '@/data/repositories/inventarioRepository';

/**
 * Matriz de variantes de un producto (solo lectura): stock por talla × color,
 * totales por fila/columna, costo promedio y precio de venta actual.
 */
export function useMatrizVariantesViewModel(productoId: number) {
  const [matriz, setMatriz] = useState<MatrizVariantes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(productoId)) return;
    const controller = new AbortController();
    inventarioRepository
      .matriz(productoId, controller.signal)
      .then((m) => {
        if (controller.signal.aborted) return;
        setMatriz(m);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar la matriz.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [productoId, recarga]);

  const reintentar = useCallback(() => {
    setCargando(true);
    setRecarga((n) => n + 1);
  }, []);

  const tallas = useMemo(() => (matriz ? ordenarTallas(matriz.tallas) : []), [matriz]);
  const indice = useMemo(() => (matriz ? indiceVariantes(matriz) : new Map()), [matriz]);

  const totalFila = useCallback(
    (colorId: number) =>
      String((matriz?.variantes ?? []).filter((v) => v.color_id === colorId).reduce((s, v) => s + v.stock, 0)),
    [matriz],
  );
  const totalColumna = useCallback(
    (tallaId: number) =>
      String((matriz?.variantes ?? []).filter((v) => v.talla_id === tallaId).reduce((s, v) => s + v.stock, 0)),
    [matriz],
  );

  return {
    cargando,
    error,
    reintentar,
    producto: matriz?.producto ?? null,
    tallas,
    colores: matriz?.colores ?? [],
    indice,
    totalVariantes: matriz?.variantes.length ?? 0,
    totalFila,
    totalColumna,
    volver: () => (router.canGoBack() ? router.back() : router.replace('/admin/inventario')),
    registrarEntrada: () => router.push('/admin/inventario/entrada'),
  };
}
