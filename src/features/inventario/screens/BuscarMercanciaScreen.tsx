import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Input, StateView } from '@/components/ui';
import { formatPrecio, precioNumero } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { useBuscarMercanciaViewModel } from '@/features/inventario/viewmodels/useBuscarMercanciaViewModel';

/**
 * Búsqueda de mercancía: encuentra un producto por nombre y abre su matriz de
 * variantes. Desde aquí también se registra una entrada o se ve el historial.
 */
export function BuscarMercanciaScreen() {
  const insets = useSafeAreaInsets();
  const vm = useBuscarMercanciaViewModel();

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
        <AppText variant="heading" style={styles.title}>
          Inventario
        </AppText>
      </View>

      <View style={styles.acciones}>
        <Button
          title="Registrar entrada"
          onPress={vm.irAEntrada}
          fullWidth={false}
          style={styles.flex}
          leftAccessory={<Ionicons name="add-circle-outline" size={18} color={colors.text.main} />}
        />
        <Button
          title="Historial"
          variant="secondary"
          onPress={vm.irAHistorial}
          fullWidth={false}
          leftAccessory={<Ionicons name="time-outline" size={18} color={colors.text.main} />}
        />
      </View>

      <View style={styles.body}>
        <Input
          placeholder="Buscar mercancía por nombre"
          value={vm.query}
          onChangeText={vm.setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          leftAccessory={<Ionicons name="search" size={18} color={colors.text.muted} />}
          containerStyle={styles.input}
        />

        {vm.idle ? (
          <StateView
            kind="empty"
            title="Busca un producto"
            message="Escribe al menos 2 letras del nombre para ver su stock por talla y color."
          />
        ) : vm.loading && vm.resultados.length === 0 ? (
          <StateView kind="loading" title="Buscando..." />
        ) : vm.error ? (
          <StateView
            kind="error"
            title="No se pudo buscar"
            message={vm.error}
            actionLabel="Reintentar"
            onAction={vm.reintentar}
          />
        ) : vm.resultados.length === 0 ? (
          <StateView kind="empty" title="Sin resultados" message="No hay productos activos con ese nombre." />
        ) : (
          <FlatList
            data={vm.resultados}
            keyExtractor={(p) => String(p.id)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={ItemGap}
            renderItem={({ item: p }) => {
              const stock = precioNumero(p.stock_total);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver matriz de ${p.nombre}`}
                  onPress={() => vm.abrir(p.id)}
                  style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
                >
                  <View style={styles.flex}>
                    <AppText variant="bodyMedium" numberOfLines={1} style={styles.semi}>
                      {p.nombre}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {[p.categoria_nombre, p.marca_nombre].filter(Boolean).join(' · ') || 'Sin categoría'}
                    </AppText>
                    <AppText variant="caption">
                      {precioNumero(p.total_variantes)} variantes · {formatPrecio(p.precio_base)}
                    </AppText>
                  </View>
                  <View style={styles.stock}>
                    <AppText variant="caption">Stock</AppText>
                    <AppText
                      variant="subtitle"
                      color={stock <= 0 ? colors.red : stock <= 5 ? colors.yellow : colors.text.main}
                    >
                      {stock}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

function ItemGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  flex: { flex: 1 },
  semi: { fontFamily: fonts.bodySemi },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  back: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  acciones: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  body: { flex: 1, paddingHorizontal: spacing.lg },
  input: { marginBottom: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  gap: { height: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.bg.cardAlt },
  stock: { alignItems: 'flex-end' },
});
