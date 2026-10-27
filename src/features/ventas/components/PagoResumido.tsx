import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import type { PagoCaptura } from '@/features/ventas/viewmodels/cobroCalculo';
import { ICONO_METODO } from './MetodoPagoSelector';

interface PagoResumidoProps {
  pago: PagoCaptura;
  /** Monto válido en pesos (`null` si el texto no es un monto > 0). */
  monto: number | null;
  deshabilitado: boolean;
  onEditar: (id: number) => void;
  onQuitar: (id: number) => void;
}

/** Pago ya capturado, en una sola línea. Tocarlo lo abre para editarlo. */
export function PagoResumido({
  pago,
  monto,
  deshabilitado,
  onEditar,
  onQuitar,
}: PagoResumidoProps) {
  const ref = pago.referencia.trim();

  return (
    // Botones hermanos (no anidados): editar el pago y quitarlo.
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Editar pago con ${pago.metodo}`}
        disabled={deshabilitado}
        onPress={() => onEditar(pago.id)}
        style={({ pressed }) => [styles.editar, pressed ? styles.rowPressed : null]}
      >
        <Ionicons name={ICONO_METODO[pago.metodo]} size={18} color={colors.accent} />
        <AppText variant="bodyMedium" numberOfLines={1} style={styles.metodo}>
          {pago.metodo}
          {ref ? <AppText variant="caption"> · {ref}</AppText> : null}
        </AppText>
        <AppText variant="bodyMedium" color={monto === null ? colors.red : colors.text.main}>
          {monto === null ? 'Sin monto' : formatPrecio(monto)}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Quitar pago con ${pago.metodo}`}
        onPress={() => onQuitar(pago.id)}
        disabled={deshabilitado}
        hitSlop={10}
        style={styles.quitar}
      >
        <Ionicons name="close" size={16} color={colors.text.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    paddingRight: spacing.sm,
  },
  editar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  rowPressed: { backgroundColor: colors.bg.cardAlt },
  metodo: { flex: 1, fontFamily: fonts.bodySemi },
  quitar: { padding: spacing.xs },
});
