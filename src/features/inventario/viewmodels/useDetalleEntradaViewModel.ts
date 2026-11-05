import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import type { EntradaDetalle } from '@/data/models/inventario';
import { inventarioRepository } from '@/data/repositories/inventarioRepository';

/**
 * Detalle de una entrada: cabecera, renglones y anulación.
 *
 * Anular (solo administrador; la ruta ya lo garantiza) exige motivo y revierte
 * el stock. El backend responde 409 si ya se vendieron piezas del lote; ese
 * mensaje se muestra tal cual.
 */
export function useDetalleEntradaViewModel(id: number) {
  const [detalle, setDetalle] = useState<EntradaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [anularAbierto, setAnularAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [errorAnular, setErrorAnular] = useState<string | null>(null);
  const enCurso = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    const controller = new AbortController();
    inventarioRepository
      .detalleEntrada(id, controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setDetalle(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar la entrada.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [id, recarga]);

  const reintentar = useCallback(() => {
    setCargando(true);
    setRecarga((n) => n + 1);
  }, []);

  const abrirAnular = useCallback(() => {
    setMotivo('');
    setErrorAnular(null);
    setMensaje(null);
    setAnularAbierto(true);
  }, []);
  const cerrarAnular = useCallback(() => {
    if (!enCurso.current) setAnularAbierto(false);
  }, []);
  const cambiarMotivo = useCallback((t: string) => {
    setMotivo(t);
    setErrorAnular(null);
  }, []);

  const activa = detalle?.cabecera.estado === 'activa';
  const puedeAnular = activa && motivo.trim().length >= 3 && !anulando;

  const anular = useCallback(async () => {
    if (!puedeAnular || enCurso.current) return;
    enCurso.current = true;
    setAnulando(true);
    setErrorAnular(null);
    try {
      const res = await inventarioRepository.anularEntrada(id, motivo.trim());
      setMensaje(res.message);
      setAnularAbierto(false);
      setRecarga((n) => n + 1);
    } catch (e) {
      setErrorAnular(e instanceof ApiError ? e.message : 'No se pudo anular la entrada.');
    } finally {
      enCurso.current = false;
      setAnulando(false);
    }
  }, [puedeAnular, id, motivo]);

  const renglones = detalle?.renglones ?? [];

  return {
    cargando,
    error,
    reintentar,
    mensaje,
    cabecera: detalle?.cabecera ?? null,
    renglones,
    piezas: renglones.reduce((s, r) => s + Number(r.cantidad), 0),
    activa,

    anularAbierto,
    abrirAnular,
    cerrarAnular,
    motivo,
    cambiarMotivo,
    puedeAnular,
    anulando,
    errorAnular,
    anular,

    volver: () =>
      router.canGoBack() ? router.back() : router.replace('/admin/inventario/entradas'),
  };
}
