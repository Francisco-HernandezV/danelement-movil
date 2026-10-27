import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

interface ProgresoAbonoProps {
  /** 0–100. */
  porcentaje: number;
  /** Color de la parte abonada (por defecto el acento; verde si liquidado). */
  color?: string;
  alto?: number;
}

/** Barra de progreso de lo abonado contra el total del apartado. */
export function ProgresoAbono({ porcentaje, color = colors.accent, alto = 6 }: ProgresoAbonoProps) {
  const pct = Math.min(100, Math.max(0, porcentaje));
  return (
    <View
      style={[styles.track, { height: alto }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: 'stretch',
    backgroundColor: colors.bg.cardAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
