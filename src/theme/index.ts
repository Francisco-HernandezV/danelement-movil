import { colors } from './colors';
import { fonts, fontSize } from './typography';
import { spacing, radius } from './spacing';

export { colors } from './colors';
export type { AppColors } from './colors';
export { fonts, fontAssets, fontSize, lineHeight } from './typography';
export { spacing, radius } from './spacing';

/** Objeto único por si se prefiere consumir el tema como un todo. */
export const theme = { colors, fonts, fontSize, spacing, radius } as const;
