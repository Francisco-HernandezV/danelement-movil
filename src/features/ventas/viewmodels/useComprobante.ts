import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/config/http';
import { compartirPdf } from '@/utils/compartirPdf';

interface ComprobanteOpciones {
  /** Descarga el PDF del backend. */
  obtener: () => Promise<Uint8Array>;
  /** Nombre del archivo, p. ej. `Ticket_DanElement_123.pdf`. */
  nombreArchivo: string;
  /** Título del menú de compartir (Android). */
  titulo: string;
}

/**
 * Generar y compartir un comprobante PDF (ticket de venta o de apartado).
 * Expone `generando` para deshabilitar el botón y `error` para mostrarlo.
 * Si el usuario cierra el menú de compartir sin elegir nada, no es un error.
 */
export function useComprobante() {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enCurso = useRef(false);

  const compartir = useCallback(async ({ obtener, nombreArchivo, titulo }: ComprobanteOpciones) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setGenerando(true);
    setError(null);
    try {
      const bytes = await obtener();
      await compartirPdf(bytes, nombreArchivo, titulo);
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : 'No se pudo generar el comprobante.',
      );
    } finally {
      enCurso.current = false;
      setGenerando(false);
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return { generando, error, compartir, limpiarError };
}
