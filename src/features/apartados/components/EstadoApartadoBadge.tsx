import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { ETIQUETA_ESTADO, type EstadoVisible } from '@/data/models/apartado';
import { colors, fonts, radius, spacing } from '@/theme';

/** Colores por estado (tokens de `@/theme`). */
const PALETA: Record<EstadoVisible, { bg: string; border: string; text: string }> = {
  activo: { bg: colors.accentSoft, border: colors.accent, text: colors.accent },
  vencido: { bg: colors.redSoft, border: colors.redBorder, text: colors.red },
  completado: { bg: colors.greenSoft, border: colors.greenBorder, text: colors.green },
  cancelado: { bg: colors.bg.cardAlt, border: colors.border, text: colors.text.muted },
};

/** Insignia del estado visible de un apartado (activo/vencido/liquidado/cancelado). */
export function EstadoApartadoBadge({ estado }: { estado: EstadoVisible }) {
  const p = PALETA[estado];
  return (
    <View style={[styles.badge, { backgroundColor: p.bg, borderColor: p.border }]}>
      <AppText variant="caption" color={p.text} style={styles.text}>
        {ETIQUETA_ESTADO[estado]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  text: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 16 },
});
