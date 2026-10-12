import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import { nombreProducto, precioVariante, type VarianteBusqueda } from '@/data/models/venta';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

interface ProductoResultRowProps {
  variante: VarianteBusqueda;
  /** Si `true`, oculta el nombre del producto (ya se mostró en el encabezado del grupo). */
  compact?: boolean;
  onPress: (variante: VarianteBusqueda) => void;
}

/**
 * Fila de resultado de búsqueda de producto (una variante = una fila).
 *
 * El backend `/ventas/buscar-producto` NO devuelve URL de imagen, así que
 * usamos un placeholder visual con el icono de etiqueta en lugar de la foto.
 */
export const ProductoResultRow = memo(function ProductoResultRow({
  variante,
  compact,
  onPress,
}: ProductoResultRowProps) {
  const stock = Number(variante.stock_disponible ?? 0);
  const sinStock = stock <= 0;
  const stockLabel = sinStock ? 'Sin stock' : `${stock} disp.`;
  const stockStyle = sinStock
    ? styles.stockBadgeOut
    : stock <= 3
      ? styles.stockBadgeLow
      : styles.stockBadge;
  const stockTextStyle = sinStock
    ? styles.stockBadgeTextOut
    : stock <= 3
      ? styles.stockBadgeTextLow
      : styles.stockBadgeText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar ${nombreProducto(variante)} talla ${variante.talla} color ${variante.color}`}
      accessibilityState={{ disabled: sinStock }}
      disabled={sinStock}
      onPress={() => onPress(variante)}
      style={({ pressed }) => [
        styles.row,
        pressed && !sinStock ? styles.rowPressed : null,
        sinStock ? styles.rowDisabled : null,
      ]}
    >
      <View style={styles.thumb}>
        <Ionicons name="pricetag" size={22} color={colors.text.muted} />
      </View>

      <View style={styles.info}>
        {!compact ? (
          <AppText variant="body" numberOfLines={1} style={styles.nombre}>
            {nombreProducto(variante)}
          </AppText>
        ) : null}
        <View style={styles.varianteRow}>
          <AppText variant="caption" style={styles.varianteText} numberOfLines={1}>
            {variante.talla} · {variante.color}
          </AppText>
          <AppText variant="caption" style={styles.sku} numberOfLines={1}>
            SKU {variante.sku}
          </AppText>
        </View>
      </View>

      <View style={styles.right}>
        <AppText variant="subtitle" style={styles.precio}>
          {formatPrecio(precioVariante(variante))}
        </AppText>
        <View style={stockStyle}>
          <AppText variant="caption" style={stockTextStyle}>
            {stockLabel}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowPressed: { backgroundColor: colors.bg.cardAlt },
  rowDisabled: { opacity: 0.55 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  nombre: { fontFamily: fonts.headingSemi },
  varianteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  varianteText: { color: colors.text.main },
  sku: { color: colors.text.muted },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  precio: {
    fontFamily: fonts.headingSemi,
    fontSize: fontSize.md,
    color: colors.accent,
  },
  stockBadge: {
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  stockBadgeText: { color: colors.green, fontSize: fontSize.xs },
  stockBadgeLow: {
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  stockBadgeTextLow: { color: colors.yellow, fontSize: fontSize.xs },
  stockBadgeOut: {
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: colors.redBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  stockBadgeTextOut: { color: colors.red, fontSize: fontSize.xs },
});
