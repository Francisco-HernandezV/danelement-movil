import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/config/http';
import type { ProductoDetalle } from '@/data/models/producto';
import { catalogoRepository } from '@/data/repositories/catalogoRepository';

/** Carga el detalle público de un producto por id. */
export function useProductDetailViewModel(id: string | number) {
  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetcher puro (sin setState) para no disparar setState síncrono en el efecto.
  const fetchDetalle = useCallback(
    (signal?: AbortSignal) => catalogoRepository.getProductoDetalle(id, signal),
    [id],
  );

  const aplicar = useCallback((p: ProductoDetalle) => {
    setProducto(p);
    setError(null);
  }, []);

  const fallar = useCallback((e: unknown) => {
    if ((e as { name?: string })?.name === 'AbortError') return;
    setError(e instanceof ApiError ? e.message : 'No se pudo cargar el producto.');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetalle(controller.signal)
      .then(aplicar)
      .catch(fallar)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchDetalle, aplicar, fallar]);

  const recargar = useCallback(() => {
    setLoading(true);
    fetchDetalle()
      .then(aplicar)
      .catch(fallar)
      .finally(() => setLoading(false));
  }, [fetchDetalle, aplicar, fallar]);

  return { producto, loading, error, recargar };
}
