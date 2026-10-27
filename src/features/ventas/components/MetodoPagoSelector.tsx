import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { METODOS_PAGO, type MetodoPago } from '@/data/models/venta';
import { colors, fonts, radius, spacing } from '@/theme';

/** Ícono de cada método de pago (compartido con las filas de pago). */
export const ICONO_METODO: Record<MetodoPago, keyof typeof Ionicons.glyphMap> = {
  Efectivo: 'cash-outline',
  'T. Débito': 'card-outline',
  'T. Crédito': 'card',
  Transferencia: 'swap-horizontal-outline',
};

interface MetodoPagoSelectorProps {
  value: MetodoPago;
  onChange: (metodo: MetodoPago) => void;
  disabled?: boolean;
}

/** Selector segmentado de método de pago: los 4 métodos en una sola fila. */
export function MetodoPagoSelector({ value, onChange, disabled = false }: MetodoPagoSelectorProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {METODOS_PAGO.map((m) => {
        const activo = value === m.value;
        return (
          <Pressable
            key={m.value}
            accessibilityRole="radio"
            accessibilityLabel={m.value}
            accessibilityState={{ selected: activo, disabled }}
            disabled={disabled || activo}
            onPress={() => onChange(m.value)}
            style={activo ? styles.optActive : styles.opt}
          >
            <Ionicons
              name={ICONO_METODO[m.value]}
              size={20}
              color={activo ? colors.accent : colors.text.muted}
            />
            <AppText
              variant="caption"
              numberOfLines={1}
              style={activo ? styles.labelActive : styles.label}
            >
              {m.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const optBase = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  paddingVertical: spacing.sm,
  borderRadius: radius.sm,
  borderWidth: 1,
} as const;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.bg.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  opt: { ...optBase, borderColor: 'transparent' },
  optActive: { ...optBase, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  label: { color: colors.text.muted, fontSize: 11 },
  labelActive: { color: colors.accent, fontSize: 11, fontFamily: fonts.bodySemi },
});
