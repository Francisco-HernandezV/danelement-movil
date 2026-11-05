import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface BarrasCategoriasProps {
  filas: { nombre: string; prendas: number; porcentaje: number }[];
}

/**
 * Prendas vendidas por categoría: barras horizontales de un solo tono
 * (magnitud, de mayor a menor). La pista es un tono claro del mismo azul y el
 * valor va en texto (no en el color de la barra).
 */
export function BarrasCategorias({ filas }: BarrasCategoriasProps) {
  const max = Math.max(0, ...filas.map((f) => f.prendas));

  return (
    <View style={styles.card}>
      <AppText variant="label">Prendas por categoría</AppText>
      {filas.length === 0 ? (
        <AppText variant="caption">Sin ventas en el periodo.</AppText>
      ) : (
        filas.map((f) => (
          <View
            key={f.nombre}
            style={styles.fila}
            accessible
            accessibilityLabel={`${f.nombre}: ${f.prendas} prendas, ${Math.round(f.porcentaje)} por ciento`}
          >
            <View style={styles.textos}>
              <AppText variant="body" numberOfLines={1} style={styles.nombre}>
                {f.nombre}
              </AppText>
              <AppText variant="caption">
                {f.prendas} pzs · {Math.round(f.porcentaje)}%
              </AppText>
            </View>
            <View style={styles.pista}>
              <View
                style={[styles.relleno, { width: `${max > 0 ? (f.prendas / max) * 100 : 0}%` }]}
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  fila: { gap: spacing.xs },
  textos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  nombre: { flex: 1 },
  pista: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    backgroundColor: colors.accent,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});
