import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { AppText } from './Typography';

export type BannerVariant = 'success' | 'error' | 'info';

interface BannerProps {
  variant?: BannerVariant;
  children: string;
}

/** Mensaje de estado de formulario (equivalente a `.mensaje-exito/.mensaje-error` de la web). */
export function Banner({ variant = 'info', children }: BannerProps) {
  const palette = VARIANTS[variant];
  return (
    <View style={[styles.base, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <AppText variant="caption" color={palette.text}>
        {children}
      </AppText>
    </View>
  );
}

const VARIANTS: Record<BannerVariant, { bg: string; border: string; text: string }> = {
  success: { bg: colors.greenSoft, border: colors.greenBorder, text: colors.green },
  error: { bg: colors.redSoft, border: colors.redBorder, text: colors.red },
  info: { bg: colors.yellowSoft, border: colors.yellowBorder, text: colors.yellow },
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
