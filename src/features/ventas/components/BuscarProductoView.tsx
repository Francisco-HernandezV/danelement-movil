import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  SectionList,
  StyleSheet,
  View,
  type SectionListData,
} from 'react-native';

import { AppText, Input, StateView } from '@/components/ui';
import type { ProductoAgrupado, VarianteBusqueda } from '@/data/models/venta';
import { varianteKey } from '@/data/models/venta';
import { colors, fonts, radius, spacing } from '@/theme';
import { ProductoResultRow } from './ProductoResultRow';
import { useBuscarProductoViewModel } from '@/features/ventas/viewmodels/useBuscarProductoViewModel';

interface BuscarProductoViewProps {
  /** Se llama al tocar una variante disponible (stock > 0). */
  onSelect: (variante: VarianteBusqueda) => void;
  /**
   * Qué mostrar mientras no hay búsqueda activa (p. ej. el carrito). Si no se
   * pasa, se muestra la invitación "Busca un producto".
   */
  contenidoInicial?: React.ReactNode;
  /** Limpia la búsqueda al seleccionar (para volver al `contenidoInicial`). */
  limpiarAlSeleccionar?: boolean;
}

/**
 * Vista reutilizable de búsqueda de productos para el POS:
 * barra de búsqueda con debounce + lista de resultados agrupados por producto.
 *
 * No se encarga de SafeArea: el padre decide dónde vive. En el POS va
 * incrustada en el paso "Productos" con el carrito como `contenidoInicial`.
 */
export function BuscarProductoView({
  onSelect,
  contenidoInicial,
  limpiarAlSeleccionar = false,
}: BuscarProductoViewProps) {
  const vm = useBuscarProductoViewModel();

  const handleSelect = (variante: VarianteBusqueda) => {
    onSelect(variante);
    if (limpiarAlSeleccionar) vm.setQuery('');
  };

  // Construimos las secciones de la SectionList a partir de los grupos.
  const sections: SectionListData<VarianteBusqueda, { nombre: string }>[] = vm.grupos.map(
    (g) => ({ nombre: g.nombre, data: g.variantes }),
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Input
        containerStyle={styles.input}
        placeholder="Buscar por nombre o SKU"
        value={vm.query}
        onChangeText={vm.setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        leftAccessory={<Ionicons name="search" size={18} color={colors.text.muted} />}
      />

      {vm.idle && contenidoInicial ? (
        contenidoInicial
      ) : vm.idle ? (
        <StateView
          kind="empty"
          title="Busca un producto"
          message="Escribe al menos 2 letras del nombre o del SKU para ver resultados."
        />
      ) : vm.loading && sections.length === 0 ? (
        <StateView kind="loading" title="Buscando..." />
      ) : vm.error ? (
        <StateView
          kind="error"
          title="No se pudo buscar"
          message={vm.error}
          actionLabel="Reintentar"
          onAction={vm.reintentar}
        />
      ) : sections.length === 0 ? (
        <StateView
          kind="empty"
          title="Sin resultados"
          message="No hay productos que coincidan con tu búsqueda."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => varianteKey(item)}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) =>
            renderSectionHeader(section as ProductoAgrupado & { data: VarianteBusqueda[] })
          }
          renderItem={({ item, section }) => (
            <View style={styles.rowWrap}>
              <ProductoResultRow
                variante={item}
                compact={section.data.length > 1}
                onPress={handleSelect}
              />
            </View>
          )}
          SectionSeparatorComponent={null}
          ItemSeparatorComponent={ItemGap}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function renderSectionHeader(section: { nombre: string; data: VarianteBusqueda[] }) {
  const n = section.data.length;
  const sub = n === 1 ? '1 variante' : `${n} variantes`;
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="subtitle" numberOfLines={1} style={styles.sectionTitle}>
        {section.nombre}
      </AppText>
      <View style={styles.sectionBadge}>
        <AppText variant="caption" style={styles.sectionBadgeText}>
          {sub}
        </AppText>
      </View>
    </View>
  );
}

function ItemGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.sm },
  input: { marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.xxl, gap: spacing.sm },
  rowWrap: { paddingHorizontal: 0 },
  gap: { height: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: { fontFamily: fonts.heading, flex: 1 },
  sectionBadge: {
    backgroundColor: colors.bg.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sectionBadgeText: { color: colors.text.muted },
});
