import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, StateView } from '@/components/ui';
import { UMBRAL_STOCK_BAJO } from '@/data/models/admin';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { KpiTile } from '@/features/admin/components/KpiTile';
import { MatrizTallaColor } from '@/features/inventario/components/MatrizTallaColor';
import { useMatrizVariantesViewModel } from '@/features/inventario/viewmodels/useMatrizVariantesViewModel';

/** Stock de un producto por talla × color, con totales y costo promedio. */
export function MatrizVariantesScreen({ productoId }: { productoId: number }) {
  const insets = useSafeAreaInsets();
  const vm = useMatrizVariantesViewModel(productoId);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={vm.volver}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" numberOfLines={1} style={styles.title}>
          {vm.producto?.nombre ?? 'Matriz de variantes'}
        </AppText>
      </View>

      {!Number.isFinite(productoId) ? (
        <StateView kind="error" title="Producto no válido" actionLabel="Volver" onAction={vm.volver} />
      ) : vm.cargando && !vm.producto ? (
        <StateView kind="loading" title="Cargando matriz..." />
      ) : !vm.producto ? (
        <StateView
          kind="error"
          title="No se pudo cargar"
          message={vm.error ?? undefined}
          actionLabel="Reintentar"
          onAction={vm.reintentar}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.row}>
            <KpiTile etiqueta="Stock total" valor={String(vm.producto.stock_total_actual)} icono="cube-outline" />
            <KpiTile etiqueta="Precio" valor={formatPrecio(vm.producto.precio_base)} icono="pricetag-outline" />
            <KpiTile
              etiqueta="Costo prom."
              valor={formatPrecio(vm.producto.costo_promedio_actual)}
              icono="calculator-outline"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <AppText variant="label">Stock por talla y color</AppText>
              <AppText variant="caption">{vm.totalVariantes} variantes</AppText>
            </View>
            {vm.totalVariantes === 0 ? (
              <AppText variant="caption">Este producto aún no tiene variantes activas.</AppText>
            ) : (
              <MatrizTallaColor
                tallas={vm.tallas}
                colores={vm.colores}
                indice={vm.indice}
                celda={(v) => ({
                  texto: String(v.stock),
                  color:
                    v.stock <= 0 ? colors.red : v.stock <= UMBRAL_STOCK_BAJO ? colors.yellow : colors.text.main,
                })}
                totalFila={vm.totalFila}
                totalColumna={vm.totalColumna}
              />
            )}
            <View style={styles.leyenda}>
              <Leyenda color={colors.red} texto="Agotado" />
              <Leyenda color={colors.yellow} texto={`Bajo (≤ ${UMBRAL_STOCK_BAJO})`} />
              <AppText variant="caption">— no existe la variante</AppText>
            </View>
          </View>

          <Button
            title="Registrar entrada de mercancía"
            onPress={vm.registrarEntrada}
            leftAccessory={<Ionicons name="add-circle-outline" size={18} color={colors.text.main} />}
          />
        </ScrollView>
      )}
    </View>
  );
}

/** Estado con ícono + texto (nunca solo color). */
function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.punto, { backgroundColor: color }]} />
      <AppText variant="caption">{texto}</AppText>
    </View>
  );
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
  back: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  card: {
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  punto: { width: 8, height: 8, borderRadius: radius.pill },
});
