import { Ionicons } from '@expo/vector-icons';
import { FlatList, Keyboard, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { VarianteBusqueda } from '@/data/models/venta';
import { colors, spacing } from '@/theme';
import type { VentaItem } from '@/features/ventas/context/VentaEnCursoContext';
import { BuscarProductoView } from './BuscarProductoView';
import { VentaItemRow } from './VentaItemRow';

interface VentaCarritoProps {
  items: VentaItem[];
  totalItems: number;
  onAgregar: (variante: VarianteBusqueda) => void;
  onInc: (variante_id: number) => void;
  onDec: (variante_id: number) => void;
  onRemove: (variante_id: number) => void;
}

/**
 * Buscador + carrito de la venta. Mientras no hay búsqueda se ve
 * el carrito. Al tocar un resultado se agrega, se limpia la búsqueda y se
 * vuelve al carrito para seguir con el siguiente producto.
 */
export function VentaCarrito({
  items,
  totalItems,
  onAgregar,
  onInc,
  onDec,
  onRemove,
}: VentaCarritoProps) {
  const handleAgregar = (v: VarianteBusqueda) => {
    onAgregar(v);
    Keyboard.dismiss();
  };

  const carrito = (
    <View style={styles.carrito}>
      <AppText variant="label">
        Carrito · {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
      </AppText>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.variante_id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={ItemGap}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <VentaItemRow item={item} onInc={onInc} onDec={onDec} onRemove={onRemove} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={36} color={colors.text.muted} />
            <AppText variant="caption" center style={styles.emptyText}>
              El carrito está vacío. Busca un producto por nombre o SKU para agregarlo.
            </AppText>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <BuscarProductoView
        onSelect={handleAgregar}
        contenidoInicial={carrito}
        limpiarAlSeleccionar
      />
    </View>
  );
}

function ItemGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  carrito: { flex: 1, gap: spacing.sm },
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  gap: { height: spacing.sm },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyText: { maxWidth: 260 },
});
