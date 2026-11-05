import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, StateView } from '@/components/ui';
import { formatFechaHora } from '@/data/models/apartado';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { ResumenFila } from '@/features/ventas/components/ResumenFila';
import { AnularEntradaSheet } from '@/features/inventario/components/AnularEntradaSheet';
import { useDetalleEntradaViewModel } from '@/features/inventario/viewmodels/useDetalleEntradaViewModel';

/** Detalle de una entrada de mercancía, con opción de anularla. */
export function DetalleEntradaScreen({ id }: { id: number }) {
  const insets = useSafeAreaInsets();
  const vm = useDetalleEntradaViewModel(id);
  const cab = vm.cabecera;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={vm.volver} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" style={styles.title}>
          Entrada #{Number.isFinite(id) ? id : '—'}
        </AppText>
      </View>

      {!Number.isFinite(id) ? (
        <StateView kind="error" title="Entrada no válida" actionLabel="Volver" onAction={vm.volver} />
      ) : vm.cargando && !cab ? (
        <StateView kind="loading" title="Cargando entrada..." />
      ) : !cab ? (
        <StateView kind="error" title="No se pudo cargar" message={vm.error ?? undefined} actionLabel="Reintentar" onAction={vm.reintentar} />
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}>
            {vm.mensaje ? <Banner variant="success">{vm.mensaje}</Banner> : null}

            {cab.estado === 'anulada' ? (
              <View style={styles.anulada}>
                <View style={styles.row}>
                  <Ionicons name="close-circle" size={18} color={colors.red} />
                  <AppText variant="bodyMedium" color={colors.red} style={styles.semi}>
                    Entrada anulada
                  </AppText>
                </View>
                <AppText variant="caption">
                  {formatFechaHora(cab.anulada_en)}
                  {cab.anulada_por_nombre ? ` · ${cab.anulada_por_nombre}` : ''}
                </AppText>
                {cab.motivo_anulacion ? (
                  <AppText variant="body">Motivo: {cab.motivo_anulacion}</AppText>
                ) : null}
              </View>
            ) : null}

            <View style={styles.card}>
              <ResumenFila etiqueta="Origen" valor={cab.origen_mercancia?.trim() || 'Sin origen'} />
              <ResumenFila etiqueta="Referencia" valor={cab.nota_referencia?.trim() || 'Sin referencia'} />
              <ResumenFila etiqueta="Fecha" valor={formatFechaHora(cab.fecha_entrada)} />
              {cab.usuario_nombre ? <ResumenFila etiqueta="Registró" valor={cab.usuario_nombre} /> : null}
              <View style={styles.divider} />
              <ResumenFila etiqueta="Piezas" valor={String(vm.piezas)} />
              <ResumenFila etiqueta="Total del lote" valor={formatPrecio(cab.total_lote)} destacado />
            </View>

            <AppText variant="label">Renglones · {vm.renglones.length}</AppText>
            <View style={styles.card}>
              {vm.renglones.map((r) => (
                <View key={r.id} style={styles.itemRow}>
                  <View style={styles.flex}>
                    <AppText variant="body" numberOfLines={1}>
                      {r.producto_nombre}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {r.talla} · {r.color} · {r.cantidad} × {formatPrecio(r.costo_unitario)}
                      {r.sku ? ` · ${r.sku}` : ''}
                    </AppText>
                  </View>
                  <AppText variant="bodyMedium" color={colors.text.price}>
                    {formatPrecio(r.subtotal)}
                  </AppText>
                </View>
              ))}
            </View>

            {vm.activa ? (
              <Button
                title="Anular entrada"
                variant="ghost"
                onPress={vm.abrirAnular}
                style={styles.anular}
              />
            ) : null}
          </ScrollView>

          <AnularEntradaSheet
            visible={vm.anularAbierto}
            folio={cab.id}
            motivo={vm.motivo}
            onMotivo={vm.cambiarMotivo}
            error={vm.errorAnular}
            anulando={vm.anulando}
            puedeAnular={vm.puedeAnular}
            onAnular={vm.anular}
            onCerrar={vm.cerrarAnular}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  flex: { flex: 1 },
  semi: { fontFamily: fonts.bodySemi },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  card: {
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  anulada: {
    gap: spacing.xs,
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: colors.redBorder,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  anular: { alignSelf: 'center' },
});
