import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Input, StateView } from '@/components/ui';
import { precioNumero } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { useBuscarMercanciaViewModel } from '@/features/inventario/viewmodels/useBuscarMercanciaViewModel';

interface AgregarProductoSheetProps {
  visible: boolean;
  /** Productos ya en el lote (se marcan). */
  enLote: number[];
  agregando: boolean;
  error: string | null;
  onElegir: (productoId: number) => void;
  onCerrar: () => void;
}

/**
 * Hoja para agregar un producto al lote. Reutiliza la búsqueda de mercancía
 * (`useBuscarMercanciaViewModel`). En iOS es page sheet; en Android el botón
 * atrás la cierra sin salir de la captura.
 */
export function AgregarProductoSheet({
  visible,
  enLote,
  agregando,
  error,
  onElegir,
  onCerrar,
}: AgregarProductoSheetProps) {
  const insets = useSafeAreaInsets();
  const esIOS = Platform.OS === 'ios';
  const vm = useBuscarMercanciaViewModel();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={esIOS ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onCerrar}
    >
      <View
        style={[
          styles.root,
          { paddingTop: esIOS ? spacing.lg : insets.top + spacing.sm, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <AppText variant="subtitle" style={styles.title}>
            Agregar producto
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onCerrar} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text.main} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Input
            placeholder="Buscar producto por nombre"
            value={vm.query}
            onChangeText={vm.setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            leftAccessory={<Ionicons name="search" size={18} color={colors.text.muted} />}
            containerStyle={styles.input}
          />
          {error ? <Banner variant="error">{error}</Banner> : null}

          {agregando ? (
            <StateView kind="loading" title="Cargando matriz..." />
          ) : vm.idle ? (
            <StateView kind="empty" title="Busca un producto" message="Escribe al menos 2 letras del nombre." />
          ) : vm.loading && vm.resultados.length === 0 ? (
            <StateView kind="loading" title="Buscando..." />
          ) : vm.error ? (
            <StateView kind="error" title="No se pudo buscar" message={vm.error} actionLabel="Reintentar" onAction={vm.reintentar} />
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
                const yaEsta = enLote.includes(p.id);
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={yaEsta ? `${p.nombre} ya está en el lote` : `Agregar ${p.nombre}`}
                    onPress={() => onElegir(p.id)}
                    style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
                  >
                    <View style={styles.flex}>
                      <AppText variant="bodyMedium" numberOfLines={1} style={styles.semi}>
                        {p.nombre}
                      </AppText>
                      <AppText variant="caption" numberOfLines={1}>
                        {precioNumero(p.total_variantes)} variantes · stock {precioNumero(p.stock_total)}
                      </AppText>
                    </View>
                    <Ionicons
                      name={yaEsta ? 'checkmark-circle' : 'add-circle-outline'}
                      size={22}
                      color={yaEsta ? colors.green : colors.accent}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function ItemGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  flex: { flex: 1 },
  semi: { fontFamily: fonts.bodySemi },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { flex: 1, fontFamily: fonts.heading },
  body: { flex: 1, paddingHorizontal: spacing.lg, gap: spacing.sm },
  input: { marginBottom: 0 },
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
});
