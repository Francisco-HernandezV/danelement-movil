import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

/**
 * Mapa que se pasa a `useFonts` en el layout raíz. Las *claves* se vuelven el
 * `fontFamily` disponible en runtime, por eso coinciden con `fonts` de abajo.
 */
export const fontAssets = {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} as const;

/**
 * Montserrat para logo / títulos / botones; Poppins para texto de cuerpo.
 * (Igual criterio que la web.)
 */
export const fonts = {
  heading: 'Montserrat_700Bold',
  headingExtra: 'Montserrat_800ExtraBold',
  headingSemi: 'Montserrat_600SemiBold',
  body: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodySemi: 'Poppins_600SemiBold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 28,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
} as const;
