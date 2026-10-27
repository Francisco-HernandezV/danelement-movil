import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import { useAuth } from '@/context/AuthContext';
import {
  rangoUltimosDias,
  variantesStockBajo,
  type ApartadoVencido,
  type EstadoCaja,
  type KpisVentas,
  type VarianteInventario,
} from '@/data/models/admin';
import { precioNumero } from '@/data/models/producto';
import { adminRepository } from '@/data/repositories/adminRepository';

/** Resultado de una sección: datos o el mensaje de error (independientes). */
interface Seccion<T> {
  datos: T | null;
  error: string | null;
}

interface Panel {
  hoy: Seccion<KpisVentas>;
  mes: Seccion<KpisVentas>;
  caja: Seccion<EstadoCaja>;
  stockBajo: Seccion<VarianteInventario[]>;
  vencidos: Seccion<ApartadoVencido[]>;
}

const VACIO: Seccion<never> = { datos: null, error: null };

function seccion<T>(r: PromiseSettledResult<T>, porDefecto: string): Seccion<T> {
  if (r.status === 'fulfilled') return { datos: r.value, error: null };
  const e = r.reason;
  return { datos: null, error: e instanceof ApiError ? e.message : porDefecto };
}

/** KPIs en números (el backend los manda como string). */
export interface KpisNumericos {
  ingresos: number;
  tickets: number;
  prendas: number;
  /** Ingreso promedio por ticket. */
  ticketPromedio: number;
}

function aNumeros(k: KpisVentas | null): KpisNumericos | null {
  if (!k) return null;
  const ingresos = precioNumero(k.total_ingresos);
  const tickets = precioNumero(k.total_tickets);
  return {
    ingresos,
    tickets,
    prendas: precioNumero(k.total_prendas),
    ticketPromedio: tickets > 0 ? ingresos / tickets : 0,
  };
}

/**
 * Lógica del Inicio del administrador: vistas rápidas del negocio.
 *
 * Carga en paralelo (con `Promise.allSettled`, así una sección caída no tumba
 * las demás): ventas de hoy y de los últimos 30 días, estado de la caja,
 * variantes con stock bajo y apartados vencidos. Se recarga al volver a la
 * pantalla y con pull-to-refresh. Todos los `setState` del efecto viven en
 * callbacks asíncronos (regla `react-hooks/set-state-in-effect`).
 */
export function useAdminInicioViewModel() {
  const { user } = useAuth();
  const [panel, setPanel] = useState<Panel>({
    hoy: VACIO,
    mes: VACIO,
    caja: VACIO,
    stockBajo: VACIO,
    vencidos: VACIO,
  });
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const hoy = rangoUltimosDias(1);
    const mes = rangoUltimosDias(30);

    void Promise.allSettled([
      adminRepository.reporteVentas(hoy, signal),
      adminRepository.reporteVentas(mes, signal),
      adminRepository.estadoCaja(signal),
      adminRepository.inventario(signal),
      adminRepository.apartadosVencidos(signal),
    ]).then(([rHoy, rMes, rCaja, rInv, rVenc]) => {
      if (signal.aborted) return;
      const inv = seccion(rInv, 'No se pudo cargar el inventario.');
      setPanel({
        hoy: (() => {
          const s = seccion(rHoy, 'No se pudieron cargar las ventas de hoy.');
          return { datos: s.datos?.kpis ?? null, error: s.error };
        })(),
        mes: (() => {
          const s = seccion(rMes, 'No se pudieron cargar las ventas del mes.');
          return { datos: s.datos?.kpis ?? null, error: s.error };
        })(),
        caja: seccion(rCaja, 'No se pudo consultar la caja.'),
        stockBajo: { datos: inv.datos ? variantesStockBajo(inv.datos) : null, error: inv.error },
        vencidos: seccion(rVenc, 'No se pudieron cargar los apartados vencidos.'),
      });
      setCargando(false);
      setRefrescando(false);
    });

    return () => controller.abort();
  }, [recarga]);

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

  const refrescar = useCallback(() => {
    setRefrescando(true);
    setRecarga((n) => n + 1);
  }, []);

  const nombre = (user?.nombre ?? '').trim().split(/\s+/)[0] || 'Administrador';

  return {
    nombre,
    cargando,
    refrescando,
    refrescar,

    hoy: aNumeros(panel.hoy.datos),
    errorHoy: panel.hoy.error,
    mes: aNumeros(panel.mes.datos),
    errorMes: panel.mes.error,

    caja: panel.caja.datos,
    errorCaja: panel.caja.error,

    stockBajo: panel.stockBajo.datos,
    errorStock: panel.stockBajo.error,

    vencidos: panel.vencidos.datos,
    errorVencidos: panel.vencidos.error,

    // Accesos
    irAVentas: () => router.push('/ventas'),
    irAApartados: () => router.push('/apartados'),
    irAReportes: () => router.push('/admin/reportes'),
    irAInventario: () => router.push('/admin/inventario'),
    volver: () => (router.canGoBack() ? router.back() : router.replace('/perfil')),
  };
}
