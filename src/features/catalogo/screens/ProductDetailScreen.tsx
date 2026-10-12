import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Heading, StateView } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { ProductGallery } from '@/features/catalogo/components/ProductGallery';
import { useProductDetailViewModel } from '@/features/catalogo/viewmodels/useProductDetailViewModel';

export function ProductDetailScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const vm = useProductDetailViewModel(id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.backBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={goBack}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.main} />
          <AppText variant="bodyMedium">Volver</AppText>
        </Pressable>
      </View>

      {vm.loading && !vm.producto ? (
        <StateView kind="loading" title="Cargando detalles..." />
      ) : vm.error && !vm.producto ? (
        <StateView
          kind="error"
          title="No se pudo cargar el producto"
          message={vm.error ?? undefined}
          actionLabel="Reintentar"
          onAction={vm.recargar}
        />
      ) : vm.producto ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ProductGallery imagenes={vm.producto.imagenes} nombre={vm.producto.nombre} />

          {vm.producto.categoria_nombre ? (
            <AppText variant="label" style={styles.categoria}>
              {vm.producto.categoria_nombre}
            </AppText>
          ) : null}

          <Heading>{vm.producto.nombre}</Heading>

          {vm.producto.marca_nombre || vm.producto.departamento_nombre ? (
            <View style={styles.metaRow}>
              {vm.producto.marca_nombre ? <MetaChip label={vm.producto.marca_nombre} /> : null}
              {vm.producto.departamento_nombre ? (
                <MetaChip label={vm.producto.departamento_nombre} />
              ) : null}
            </View>
          ) : null}

          <AppText style={styles.precio}>{formatPrecio(vm.producto.precio_base)}</AppText>

          <View style={styles.section}>
            <AppText variant="label">Descripción</AppText>
            <AppText variant="body" style={styles.descripcion}>
              {vm.producto.descripcion?.trim()
                ? vm.producto.descripcion
                : 'Este producto no cuenta con una descripción detallada por el momento.'}
            </AppText>
          </View>

          <View style={styles.note}>
            <Ionicons name="pricetags-outline" size={16} color={colors.text.muted} />
            <AppText variant="caption" style={styles.noteText}>
              Consulta las tallas y colores disponibles directamente en tienda.
            </AppText>
          </View>

          <View style={styles.actions}>
            <Button title="Añadir al carrito" disabled onPress={() => {}} />
            <Button title="Apartar en tienda" variant="secondary" disabled onPress={() => {}} />
            <AppText variant="caption" center style={styles.actionsHint}>
              La compra y el apartado estarán disponibles próximamente.
            </AppText>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <AppText variant="caption" color={colors.text.main}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.body },
  backBar: { paddingHorizontal: spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  categoria: { marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.cardAlt,
  },
  precio: {
    fontFamily: fonts.headingExtra,
    fontSize: 26,
    color: colors.red,
    marginTop: spacing.xs,
  },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  descripcion: { color: colors.text.muted },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.card,
  },
  noteText: { flex: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  actionsHint: { marginTop: spacing.xs },
});
