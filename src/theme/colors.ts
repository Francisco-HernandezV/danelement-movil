/**
 * Paleta de color de DanElement Boutique.
 * Replica exactamente las variables de `theme.css` de la app web para que
 * móvil y web se vean como el mismo producto.
 */
export const colors = {
  bg: {
    /** Fondo general de la app */
    body: '#0f1115',
    /** Superficie de tarjetas y formularios */
    card: '#161b22',
    /** Superficie alterna (chips, avatares) */
    cardAlt: '#1f242c',
    /** Fondo de inputs (translúcido sobre el body) */
    input: 'rgba(15, 17, 21, 0.6)',
    /** Fondo de input enfocado */
    inputFocus: 'rgba(15, 17, 21, 0.85)',
    /** Pie de página / zonas profundas */
    footer: '#0a0c10',
  },
  text: {
    main: '#ffffff',
    muted: '#8b949e',
    /** Texto sobre superficies claras / acentos */
    inverse: '#0f1115',
  },
  /** Azul de marca */
  accent: '#3b82f6',
  accentHover: '#2563eb',
  /** Estados */
  yellow: '#f59e0b',
  red: '#ef4444',
  green: '#10b981',
  border: '#30363d',

  /** Versiones translúcidas para fondos de estado / anillos de foco */
  accentSoft: 'rgba(59, 130, 246, 0.15)',
  greenSoft: 'rgba(16, 185, 129, 0.12)',
  greenBorder: 'rgba(16, 185, 129, 0.35)',
  redSoft: 'rgba(239, 68, 68, 0.10)',
  redBorder: 'rgba(239, 68, 68, 0.35)',
  yellowSoft: 'rgba(245, 158, 11, 0.12)',
  yellowBorder: 'rgba(245, 158, 11, 0.35)',
} as const;

export type AppColors = typeof colors;
