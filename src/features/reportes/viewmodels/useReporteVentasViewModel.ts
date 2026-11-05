import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '@/config/http';
import {
  rangoPeriodo,
  serieVentas,
  type CategoriaAdmin,
  type PeriodoReporte,
  type ReporteVentas,
  type VentaHistorial,
} from '@/data/models/admin';
import { precioNumero } from '@/data/models/producto';
import { adminRepository } from '@/data/repositories/adminRepository';
import { ventasRepository } from '@/data/repositories/ventasRepository';
import { useComprobante } from '@/features/ventas/viewmodels/useComprobante';

function mensaje(e: unknown, porDefecto: string): string {
  return e instanceof ApiError ? e.message : porDefecto;
}

/**
 * Lógica del Reporte de ventas del administrador.
 *
 * - Periodo rápido (hoy, 7/30 días, este mes, mes anterior, este año) y
 *   filtro opcional por categoría → `GET /admin/reportes/ventas`.
 * - KPIs, serie por día (o por mes en rangos largos, con días sin ventas en
 *   0), top categorías (prendas) y top productos (ingresos).
 * - Últimas 50 ventas (`GET /ventas/historial`), con su ticket PDF.
 * - Cancela la consulta anterior al cambiar filtros; los `setState` del
 *   efecto viven en callbacks asíncronos (regla `set-state-in-effect`).
 */
export function useReporteVentasViewModel() {
  const [periodo, setPeriodoState] = useState<PeriodoReporte>('30d');
  const [categoriaId, setCategoriaState] = useState<number | null>(null);
  const [reporte, setReporte] = useState<ReporteVentas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  /** Barra tocada en la gráfica (índice en `serie`). */
  const [seleccion, setSeleccion] = useState<number | null>(null);

  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [ventas, setVentas] = useState<VentaHistorial[] | null>(null);
  const [errorVentas, setErrorVentas] = useState<string | null>(null);

  const comprobante = useComprobante();

  const rango = useMemo(() => rangoPeriodo(periodo), [periodo]);

  // Reporte (se repite al cambiar periodo/categoría o al refrescar).
  useEffect(() => {
    const controller = new AbortController();
    adminRepository
      .reporteVentas(rango, controller.signal, categoriaId)
      .then((r) => {
        if (controller.signal.aborted) return;
        setReporte(r);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
        setError(mensaje(e, 'No se pudo generar el reporte.'));
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setCargando(false);
        setRefrescando(false);
      });
    return () => controller.abort();
  }, [rango, categoriaId, recarga]);

  // Categorías (una vez) y últimas ventas (también al refrescar).
  useEffect(() => {
    const controller = new AbortController();
    adminRepository
      .categorias(controller.signal)
      .then((c) => {
        if (!controller.signal.aborted) setCategorias(c.filter((x) => x.activo !== false));
      })
      .catch(() => {
        // Sin categorías solo se oculta el filtro; el reporte sigue funcionando.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    adminRepository
      .historialVentas(controller.signal)
      .then((v) => {
        if (controller.signal.aborted) return;
        setVentas(v);
        setErrorVentas(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || (e as { name?: string })?.name === 'AbortError') return;
        setErrorVentas(mensaje(e, 'No se pudieron cargar las últimas ventas.'));
      });
    return () => controller.abort();
  }, [recarga]);

  // ── Filtros ──
  const setPeriodo = useCallback((p: PeriodoReporte) => {
    setPeriodoState(p);
    setSeleccion(null);
    setCargando(true);
  }, []);

  const setCategoria = useCallback((id: number | null) => {
    setCategoriaState(id);
    setSeleccion(null);
    setCargando(true);
  }, []);

  const refrescar = useCallback(() => {
    setRefrescando(true);
    setRecarga((n) => n + 1);
  }, []);

  const reintentar = useCallback(() => {
    setCargando(true);
    setRecarga((n) => n + 1);
  }, []);

  // ── Datos derivados ──
  const serie = useMemo(
    () => (reporte ? serieVentas(reporte.diario, rango) : []),
    [reporte, rango],
  );

  const kpis = useMemo(() => {
    if (!reporte) return null;
    const ingresos = precioNumero(reporte.kpis.total_ingresos);
    const tickets = precioNumero(reporte.kpis.total_tickets);
    return {
      ingresos,
      tickets,
      prendas: precioNumero(reporte.kpis.total_prendas),
      ticketPromedio: tickets > 0 ? ingresos / tickets : 0,
    };
  }, [reporte]);

  const topCategorias = useMemo(() => {
    const rows = (reporte?.topCategorias ?? []).map((c) => ({
      nombre: c.name,
      prendas: precioNumero(c.value),
    }));
    const total = rows.reduce((s, r) => s + r.prendas, 0);
    return rows.map((r) => ({ ...r, porcentaje: total > 0 ? (r.prendas / total) * 100 : 0 }));
  }, [reporte]);

  const topProductos = useMemo(
    () =>
      (reporte?.topProductos ?? []).map((p) => ({
        nombre: p.producto,
        cantidad: precioNumero(p.cantidad),
        ingresos: precioNumero(p.ingresos),
      })),
    [reporte],
  );

  const seleccionar = useCallback(
    (i: number) => setSeleccion((actual) => (actual === i ? null : i)),
    [],
  );

  const compartirTicket = useCallback(
    (id: number) => {
      void comprobante.compartir({
        obtener: () => ventasRepository.ticketPdf(id),
        nombreArchivo: `Ticket_DanElement_${id}.pdf`,
        titulo: `Ticket de venta #${id}`,
      });
    },
    [comprobante],
  );

  return {
    // Filtros
    periodo,
    setPeriodo,
    rango,
    categorias,
    categoriaId,
    setCategoria,

    // Estado
    cargando,
    refrescando,
    error,
    refrescar,
    reintentar,

    // Datos
    kpis,
    serie,
    porMes: serie.length > 0 && serie[0].clave.length === 7,
    seleccion: seleccion !== null && seleccion < serie.length ? seleccion : null,
    seleccionar,
    topCategorias,
    topProductos,

    // Últimas ventas + ticket
    ventas,
    errorVentas,
    compartirTicket,
    generandoTicket: comprobante.generando,
    errorTicket: comprobante.error,

    volver: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
  };
}
