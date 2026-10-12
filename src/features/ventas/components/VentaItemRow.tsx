import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { VentaItem } from '@/features/ventas/context/VentaEnCursoContext';

interface VentaItemRowProps {
  item: VentaItem;
  onInc: (variante_id: number) => void;
  onDec: (variante_id: number) => void;
  onRemove: (variante_id: number) => void;
}

/** Fila del carrito con stepper +/- y botón quitar. */
export const VentaItemRow = memo(function VentaItemRow({
  item,
  onInc,
  onDec,
  onRemove,
}: VentaItemRowProps) {
  const sinMasStock = item.cantidad >= item.stock_disponible;
  const subtotal = item.precio_unitario * item.cantidad;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <AppText variant="body" numberOfLines={1} style={styles.nombre}>
          {item.producto_nombre}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={styles.sub}>
          {item.talla} · {item.color} · SKU {item.sku}
        </AppText>
        <AppText variant="caption" style={styles.precio}>
          {formatPrecio(item.precio_unitario)} c/u
        </AppText>
      </View>

      <View style={styles.right}>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.cantidad === 1 ? 'Quitar producto' : 'Disminuir cantidad'}
            onPress={() => onDec(item.variante_id)}
            hitSlop={8}
            style={({ pressed }) => [styles.stepBtn, pressed ? styles.stepBtnPressed : null]}
          >
            <Ionicons
              name={item.cantidad === 1 ? 'trash-outline' : 'remove'}
              size={16}
              color={colors.text.main}
            />
          </Pressable>
          <AppText variant="bodyMedium" style={styles.cantidad}>
            {item.cantidad}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar cantidad"
            accessibilityState={{ disabled: sinMasStock }}
            disabled={sinMasStock}
            onPress={() => onInc(item.variante_id)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.stepBtn,
              pressed && !sinMasStock ? styles.stepBtnPressed : null,
              sinMasStock ? styles.stepBtnDisabled : null,
            ]}
          >
            <Ionicons name="add" size={16} color={colors.text.main} />
          </Pressable>
        </View>
        <AppText variant="subtitle" style={styles.subtotal}>
          {formatPrecio(subtotal)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitar del carrito"
          onPress={() => onRemove(item.variante_id)}
          hitSlop={8}
        >
          <AppText variant="caption" style={styles.quitar}>
            Quitar
          </AppText>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  info: { flex: 1, gap: 2 },
  nombre: { fontFamily: fonts.headingSemi },
  sub: { color: colors.text.muted },
  precio: { color: colors.text.muted },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: { backgroundColor: colors.bg.input },
  stepBtnDisabled: { opacity: 0.4 },
  cantidad: { minWidth: 20, textAlign: 'center' },
  subtotal: { fontFamily: fonts.headingSemi, fontSize: fontSize.md, color: colors.accent },
  quitar: { color: colors.red },
});
