import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateView } from '@/components/ui';
import type { Producto } from '@/data/models/producto';
import { colors, spacing } from '@/theme';
import { CatalogHeader } from '@/features/catalogo/components/CatalogHeader';
import { CategoryChips } from '@/features/catalogo/components/CategoryChips';
import { FiltersSheet } from '@/features/catalogo/components/FiltersSheet';
import { ProductCard } from '@/features/catalogo/components/ProductCard';
import { SearchBar } from '@/features/catalogo/components/SearchBar';
import { useCatalogoViewModel } from '@/features/catalogo/viewmodels/useCatalogoViewModel';

type GhostItem = { __ghost: true; id: string };
type GridItem = Producto | GhostItem;

const isGhost = (item: GridItem): item is GhostItem => '__ghost' in item;

export function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const vm = useCatalogoViewModel();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const initialLoading = vm.loading && vm.totalProductos === 0 && !vm.error;
  const showError = Boolean(vm.error) && vm.totalProductos === 0;

  // Si el número de productos es impar, agregamos una celda "fantasma" para que
  // la última tarjeta conserve el ancho de media columna (y no se estire).
  const data = useMemo<GridItem[]>(() => {
    const items: GridItem[] = [...vm.productos];
    if (items.length % 2 === 1) items.push({ __ghost: true, id: '__ghost__' });
    return items;
  }, [vm.productos]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.top}>
        <CatalogHeader />
        <SearchBar
          value={vm.search}
          onChangeText={vm.setSearch}
          onOpenFilters={() => setFiltersOpen(true)}
          filtersActive={vm.filtrosActivos}
        />
      </View>

      <CategoryChips
        categorias={vm.categorias}
        selectedId={vm.categoriaId}
        onSelect={vm.setCategoriaId}
      />

      {initialLoading ? (
        <StateView kind="loading" title="Cargando productos..." />
      ) : showError ? (
        <StateView
          kind="error"
          title="No se pudo cargar el catálogo"
          message={vm.error ?? undefined}
          actionLabel="Reintentar"
          onAction={vm.recargar}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) =>
            isGhost(item) ? <View style={styles.ghost} /> : <ProductCard producto={item} />
          }
          numColumns={2}
          style={styles.list}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.loading}
              onRefresh={vm.recargar}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <StateView
              kind="empty"
              title="Sin resultados"
              message="No hay productos que coincidan con tu búsqueda o filtros."
            />
          }
        />
      )}

      <FiltersSheet
        visible={filtersOpen}
        filtros={vm.filtros}
        onApply={vm.setFiltros}
        onClose={() => setFiltersOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.body },
  top: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  list: { flex: 1 },
  column: { gap: spacing.md, paddingHorizontal: spacing.lg },
  listContent: { gap: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  ghost: { flex: 1 },
});
