import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/config/http';
import type { Categoria, Producto } from '@/data/models/producto';
import { precioNumero } from '@/data/models/producto';
import { catalogoRepository } from '@/data/repositories/catalogoRepository';

export type OrdenCatalogo = 'relevancia' | 'precio_asc' | 'precio_desc' | 'nombre';

export interface CatalogoFiltros {
  precioMin: string;
  precioMax: string;
  orden: OrdenCatalogo;
}

export const FILTROS_INICIALES: CatalogoFiltros = {
  precioMin: '',
  precioMax: '',
  orden: 'relevancia',
};

/** Quita acentos y pasa a minúsculas para una búsqueda tolerante. */
function normaliza(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function useCatalogoViewModel() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [filtros, setFiltros] = useState<CatalogoFiltros>(FILTROS_INICIALES);

  // Fetcher PURO: devuelve datos, no toca estado. Así el efecto no llama a
  // ningún setState de forma síncrona (van en callbacks .then/.catch/.finally).
  const fetchCatalogo = useCallback(
    (signal?: AbortSignal) =>
      Promise.all([
        catalogoRepository.getProductos(signal),
        catalogoRepository.getCategorias(signal),
      ]).then(([prods, cats]) => ({
        productos: prods.filter((p) => p.activo),
        categorias: cats.filter((c) => c.activo),
      })),
    [],
  );

  const aplicar = useCallback((data: { productos: Producto[]; categorias: Categoria[] }) => {
    setProductos(data.productos);
    setCategorias(data.categorias);
    setError(null);
  }, []);

  const fallar = useCallback((e: unknown) => {
    if ((e as { name?: string })?.name === 'AbortError') return;
    setError(e instanceof ApiError ? e.message : 'No se pudo cargar el catálogo.');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCatalogo(controller.signal)
      .then(aplicar)
      .catch(fallar)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchCatalogo, aplicar, fallar]);

  // Reintentar / pull-to-refresh desde eventos (no desde un efecto).
  const recargar = useCallback(() => {
    setLoading(true);
    fetchCatalogo()
      .then(aplicar)
      .catch(fallar)
      .finally(() => setLoading(false));
  }, [fetchCatalogo, aplicar, fallar]);

  const productosFiltrados = useMemo(() => {
    const q = normaliza(search);
    const min = filtros.precioMin ? Number(filtros.precioMin) : null;
    const max = filtros.precioMax ? Number(filtros.precioMax) : null;

    const lista = productos.filter((p) => {
      if (categoriaId != null && p.categoria_id !== categoriaId) return false;

      if (q) {
        const haystack = normaliza(
          `${p.nombre} ${p.descripcion ?? ''} ${p.categoria_nombre ?? ''} ${p.marca_nombre ?? ''}`,
        );
        if (!haystack.includes(q)) return false;
      }

      const precio = precioNumero(p.precio_base);
      if (min != null && Number.isFinite(min) && precio < min) return false;
      if (max != null && Number.isFinite(max) && precio > max) return false;

      return true;
    });

    switch (filtros.orden) {
      case 'precio_asc':
        return [...lista].sort((a, b) => precioNumero(a.precio_base) - precioNumero(b.precio_base));
      case 'precio_desc':
        return [...lista].sort((a, b) => precioNumero(b.precio_base) - precioNumero(a.precio_base));
      case 'nombre':
        return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      default:
        return lista;
    }
  }, [productos, search, categoriaId, filtros]);

  const filtrosActivos =
    filtros.precioMin !== '' || filtros.precioMax !== '' || filtros.orden !== 'relevancia';

  const limpiarFiltros = useCallback(() => setFiltros(FILTROS_INICIALES), []);

  return {
    loading,
    error,
    categorias,
    productos: productosFiltrados,
    totalProductos: productos.length,
    search,
    setSearch,
    categoriaId,
    setCategoriaId,
    filtros,
    setFiltros,
    filtrosActivos,
    limpiarFiltros,
    recargar,
  };
}
