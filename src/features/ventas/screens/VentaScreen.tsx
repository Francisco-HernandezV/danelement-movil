import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { VentaClienteCard } from '@/features/ventas/components/VentaClienteCard';
import { VentaItemRow } from '@/features/ventas/components/VentaItemRow';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';

/**
 * Pantalla del Punto de Venta.
 *
 * Reúne la selección de cliente (opcional) y la lista de productos agregados.
 * El estado vive en el contexto `VentaEnCursoContext` (montado en el layout
 * del grupo `(vendedor)`), no en variables sueltas aquí.
 *
 * "Cobrar" abre la pantalla de cobro (`/cobro`), que registra la venta con
 * `POST /api/ventas/procesar`.
 */
export function VentaScreen() {
  const insets = useSafeAreaInsets();
  const venta = useVentaEnCurso();

  const irBuscarProducto = () => router.push('/buscar-producto');
  const irBuscarCliente = () => router.push('/buscar-cliente');
  const irCobrar = () => router.push('/cobro');

  const confirmarNueva = () => {
    if (venta.isEmpty && !venta.cliente && !venta.sinCliente) {
      venta.nuevaVenta();
      return;
    }
    Alert.alert(
      'Nueva venta',
      'Se perderán el cliente y los productos agregados. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Nueva venta', style: 'destructive', onPress: () => venta.nuevaVenta() },
      ],
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salir del punto de venta"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" style={styles.title}>
          Punto de venta
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nueva venta"
          onPress={confirmarNueva}
          hitSlop={8}
        >
          <AppText variant="link">Nueva</AppText>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.section}>
          <AppText variant="label" style={styles.sectionLabel}>
            Cliente
          </AppText>
          <VentaClienteCard
            cliente={venta.cliente}
            sinCliente={venta.sinCliente}
            onBuscar={irBuscarCliente}
            onQuitar={venta.quitarCliente}
          />
        </View>

        <View style={styles.sectionItems}>
          <View style={styles.sectionHeaderRow}>
            <AppText variant="label" style={styles.sectionLabel}>
              Productos
            </AppText>
            <AppText variant="caption" style={styles.counter}>
              {venta.totalItems} {venta.totalItems === 1 ? 'artículo' : 'artículos'}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar producto"
            onPress={irBuscarProducto}
            style={({ pressed }) => [styles.addBtn, pressed ? styles.addBtnPressed : null]}
          >
            <Ionicons name="search" size={18} color={colors.accent} />
            <AppText variant="bodyMedium" style={styles.addBtnText}>
              Buscar y agregar producto
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </Pressable>

          <FlatList
            data={venta.items}
            keyExtractor={(it) => String(it.variante_id)}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={ItemGap}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <VentaItemRow
                item={item}
                onInc={venta.incrementar}
                onDec={venta.decrementar}
                onRemove={venta.quitarItem}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="cart-outline" size={32} color={colors.text.muted} />
                <AppText variant="caption" center style={styles.emptyText}>
                  Aún no hay productos. Toca &ldquo;Buscar y agregar producto&rdquo;.
                </AppText>
              </View>
            }
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.totalRow}>
          <AppText variant="label" style={styles.sectionLabel}>
            Subtotal
          </AppText>
          <AppText variant="heading" style={styles.total}>
            {formatPrecio(venta.subtotal)}
          </AppText>
        </View>
        <Button
          title="Cobrar"
          onPress={irCobrar}
          disabled={venta.isEmpty}
          variant="primary"
        />
      </View>
    </View>
  );
}

function ItemGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionItems: { flex: 1, gap: spacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: { color: colors.text.muted },
  counter: { color: colors.text.muted },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  addBtnPressed: { opacity: 0.7 },
  addBtnText: { flex: 1, color: colors.accent, fontFamily: fonts.bodySemi },
  list: { paddingVertical: spacing.sm, paddingBottom: spacing.xl, flexGrow: 1 },
  gap: { height: spacing.sm },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyText: { maxWidth: 240 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: { fontFamily: fonts.headingExtra, fontSize: fontSize.xxl, color: colors.text.main },
});
