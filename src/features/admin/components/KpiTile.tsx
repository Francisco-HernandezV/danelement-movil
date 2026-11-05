import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';

interface KpiTileProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono: keyof typeof Ionicons.glyphMap;
}

/** Indicador compacto: ícono, etiqueta, valor grande y detalle opcional. */
export function KpiTile({ etiqueta, valor, detalle, icono }: KpiTileProps) {
  return (
    <View style={styles.tile}>
      <View style={styles.top}>
        <Ionicons name={icono} size={16} color={colors.accent} />
        <AppText variant="caption" numberOfLines={1} style={styles.etiqueta}>
          {etiqueta}
        </AppText>
      </View>
      <AppText variant="subtitle" numberOfLines={1} style={styles.valor}>
        {valor}
      </AppText>
      {detalle ? (
        <AppText variant="caption" numberOfLines={1}>
          {detalle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: 2,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  etiqueta: { flex: 1 },
  valor: { fontFamily: fonts.headingSemi, color: colors.text.main },
});
