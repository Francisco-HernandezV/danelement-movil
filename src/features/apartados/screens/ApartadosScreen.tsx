import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Input, StateView } from '@/components/ui';
import { FILTROS_APARTADO } from '@/data/models/apartado';
import { colors, fonts, radius, spacing } from '@/theme';
import { ApartadoRow } from '@/features/apartados/components/ApartadoRow';
import { useApartadosViewModel } from '@/features/apartados/viewmodels/useApartadosViewModel';

/**
 * Lista de apartados del vendedor: filtro por estado, búsqueda por folio o
 * cliente y acceso a "Nuevo apartado". Los vencidos aparecen primero.
 */
export function ApartadosScreen() {
  const insets = useSafeAreaInsets();
  const vm = useApartadosViewModel();

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={volver}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" style={styles.title}>
          Apartados
        </AppText>
      </View>

      <View style={styles.controls}>
        <Input
          placeholder="Buscar por folio, nombre o teléfono"
          value={vm.query}
          onChangeText={vm.setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          leftAccessory={<Ionicons name="search" size={18} color={colors.text.muted} />}
          containerStyle={styles.search}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTROS_APARTADO.map((f) => {
            const activo = vm.filtro === f.value;
            return (
              <Pressable
                key={f.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
                onPress={() => vm.setFiltro(f.value)}
                style={activo ? styles.chipActive : styles.chip}
              >
                <AppText variant="caption" style={activo ? styles.chipTextActive : styles.chipText}>
                  {f.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {vm.cargando && vm.apartados.length === 0 ? (
        <StateView kind="loading" title="Cargando apartados..." />
      ) : vm.error && vm.apartados.length === 0 ? (
        <StateView
          kind="error"
          title="No se pudieron cargar"
          message={vm.error}
          actionLabel="Reintentar"
          onAction={vm.reintentar}
        />
      ) : (
        <FlatList
          data={vm.apartados}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => <ApartadoRow apartado={item} onPress={vm.abrir} />}
          ItemSeparatorComponent={ItemGap}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={vm.refrescando}
              onRefresh={vm.refrescar}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.bg.card}
            />
          }
          ListEmptyComponent={
            <StateView
              kind="empty"
              title="Sin apartados"
              message={
                vm.query.trim()
                  ? 'No hay apartados que coincidan con tu búsqueda.'
                  : 'No hay apartados en este estado.'
              }
            />
          }
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Nuevo apartado"
          onPress={vm.nuevo}
          leftAccessory={<Ionicons name="add" size={20} color={colors.text.main} />}
        />
      </View>
    </View>
  );
}

function ItemGap() {
  return <View style={styles.gap} />;
}

const chipBase = {
  borderWidth: 1,
  borderRadius: radius.pill,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
} as const;

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
  controls: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  search: { marginBottom: 0 },
  chips: { gap: spacing.sm },
  chip: { ...chipBase, borderColor: colors.border, backgroundColor: colors.bg.card },
  chipActive: { ...chipBase, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.text.muted },
  chipTextActive: { color: colors.accent, fontFamily: fonts.bodySemi },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xl, flexGrow: 1 },
  gap: { height: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
  },
});
