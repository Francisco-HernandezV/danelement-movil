/**
 * Estructura de los documentos legales que la app muestra en pantalla.
 * El texto admite **negritas** con doble asterisco.
 *
 * Deben mantenerse iguales a las páginas /terminos y /privacidad del sitio
 * web (frontend/src/pages/legal) y con la misma versión que guarda el backend
 * (backend/src/config/schema.js) al aceptar en el registro.
 */
export type LegalBlock =
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'nota'; texto: string }
  | { tipo: 'lista'; items: string[]; ordenada?: boolean }
  /** Tabla mostrada como tarjetas: cada fila es una tarjeta con sus columnas. */
  | { tipo: 'tabla'; columnas: string[]; filas: string[][] };

export interface LegalSection {
  titulo: string;
  bloques: LegalBlock[];
}

export interface LegalDoc {
  titulo: string;
  version: string;
  vigencia: string;
  introduccion?: string;
  secciones: LegalSection[];
}

export const FECHA_VIGENCIA = '4 de noviembre de 2026';
export const TERMINOS_VERSION = '1.1';
export const AVISO_VERSION = '1.0';
