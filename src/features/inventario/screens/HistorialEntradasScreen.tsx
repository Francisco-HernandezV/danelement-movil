import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, StateView } from '@/components/ui';
import { formatFechaHora } from '@/data/models/apartado';
import { formatPrecio, precioNumero } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { useHistorialEntradasViewModel } from '@/features/inventario/viewmodels/useHistorialEntradasViewModel';

/** Historial de entradas de mercancía (activas y anuladas). */
export function HistorialEntradasScreen() {
  const insets = useSafeAreaInsets();
  const vm = useHistorialEntradasViewModel();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={vm.volver} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" style={styles.title}>
          Historial de entradas
        </AppText>
      </View>

      {vm.cargando && vm.entradas.length === 0 ? (
        <StateView kind="loading" title="Cargando historial..." />
      ) : vm.error && vm.entradas.length === 0 ? (
        <StateView kind="error" title="No se pudo cargar" message={vm.error} actionLabel="Reintentar" onAction={vm.reintentar} />
      ) : (
        <FlatList
          data={vm.entradas}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={ItemGap}
          refreshControl={
            <RefreshControl
              refreshing={vm.refrescando}
              onRefresh={vm.refrescar}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.bg.card}
            />
          }
          ListEmptyComponent={<StateView kind="empty" title="Sin entradas" message="Aún no se ha registrado mercancía." />}
          renderItem={({ item: e }) => {
            const anulada = e.estado === 'anulada';
            const piezas = precioNumero(e.total_piezas ?? 0);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Entrada ${e.id}${anulada ? ', anulada' : ''}`}
                onPress={() => vm.abrir(e.id)}
                style={({ pressed }) => [styles.card, pressed ? styles.pressed : null, anulada ? styles.anulada : null]}
              >
                <View style={styles.flex}>
                  <View style={styles.top}>
                    <AppText variant="caption" style={styles.semi}>
                      #{e.id}
                    </AppText>
                    {anulada ? (
                      <View style={styles.badge}>
                        <Ionicons name="close-circle" size={12} color={colors.red} />
                        <AppText variant="caption" color={colors.red} style={styles.badgeText}>
                          Anulada
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText variant="bodyMedium" numberOfLines={1} style={styles.semi}>
                    {e.origen_mercancia?.trim() || 'Sin origen'}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {formatFechaHora(e.fecha_entrada)}
                    {e.usuario_nombre ? ` · ${e.usuario_nombre}` : ''}
                  </AppText>
                </View>
                <View style={styles.montos}>
                  <AppText variant="bodyMedium" color={anulada ? colors.text.muted : colors.text.price}>
                    {formatPrecio(e.total_lote)}
                  </AppText>
                  <AppText variant="caption">
                    {piezas} {piezas === 1 ? 'pieza' : 'piezas'}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
              </Pressable>
            );
          }}
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Registrar entrada"
          onPress={vm.nueva}
          leftAccessory={<Ionicons name="add" size={20} color={colors.text.main} />}
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
  flex: { flex: 1 },
  semi: { fontFamily: fonts.bodySemi },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
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
  anulada: { opacity: 0.7 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.redBorder,
    backgroundColor: colors.redSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  badgeText: { fontSize: 11, fontFamily: fonts.bodySemi },
  montos: { alignItems: 'flex-end' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
  },
});
