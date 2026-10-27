import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, ConfirmSheet, StateView } from '@/components/ui';
import {
  diasHasta,
  formatFechaHora,
  formatFechaLimite,
  textoVigencia,
} from '@/data/models/apartado';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { ResumenFila } from '@/features/ventas/components/ResumenFila';
import { AbonoSheet } from '@/features/apartados/components/AbonoSheet';
import { EstadoApartadoBadge } from '@/features/apartados/components/EstadoApartadoBadge';
import { ProgresoAbono } from '@/features/apartados/components/ProgresoAbono';
import { useApartadoDetalleViewModel } from '@/features/apartados/viewmodels/useApartadoDetalleViewModel';

/**
 * Detalle de un apartado: saldo y vigencia, artículos, historial de abonos y
 * acciones (abonar, liquidar, cancelar) mientras esté activo.
 */
export function ApartadoDetalleScreen({ id }: { id: number }) {
  const insets = useSafeAreaInsets();
  const vm = useApartadoDetalleViewModel(id);
  const cab = vm.cabecera;

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/apartados'));

  const header = (
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
        Apartado #{Number.isFinite(id) ? id : '—'}
      </AppText>
      {vm.estado ? <EstadoApartadoBadge estado={vm.estado} /> : null}
    </View>
  );

  if (!Number.isFinite(id)) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        {header}
        <StateView kind="error" title="Apartado no válido" actionLabel="Volver" onAction={volver} />
      </View>
    );
  }

  if (!cab) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        {header}
        {vm.cargando ? (
          <StateView kind="loading" title="Cargando apartado..." />
        ) : (
          <StateView
            kind="error"
            title="No se pudo cargar"
            message={vm.error ?? undefined}
            actionLabel="Reintentar"
            onAction={vm.reintentar}
          />
        )}
      </View>
    );
  }

  const dias = diasHasta(cab.fecha_limite);
  const vencido = vm.estado === 'vencido';
  const liquidado = vm.estado === 'completado';

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      {header}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {vm.mensaje ? <Banner variant="success">{vm.mensaje}</Banner> : null}
        {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}

        {/* Saldo y vigencia */}
        <View style={styles.card}>
          <View style={styles.clienteRow}>
            <Ionicons name="person" size={18} color={colors.accent} />
            <View style={styles.flex}>
              <AppText variant="bodyMedium" numberOfLines={1} style={styles.semi}>
                {cab.cliente_nombre?.trim() || 'Cliente sin nombre'}
              </AppText>
              {cab.cliente_tel || cab.cliente_email ? (
                <AppText variant="caption" numberOfLines={1}>
                  {[cab.cliente_tel, cab.cliente_email].filter(Boolean).join(' · ')}
                </AppText>
              ) : null}
            </View>
          </View>

          <View style={styles.saldoRow}>
            <View>
              <AppText variant="caption">{liquidado ? 'Liquidado' : 'Saldo pendiente'}</AppText>
              <AppText style={styles.saldo} color={liquidado ? colors.green : colors.text.price}>
                {formatPrecio(liquidado ? vm.total : vm.saldo)}
              </AppText>
            </View>
            {vm.activo ? (
              <View style={styles.vigencia}>
                <AppText variant="caption" color={vencido ? colors.red : undefined}>
                  {textoVigencia(dias)}
                </AppText>
                <AppText variant="caption">Límite {formatFechaLimite(cab.fecha_limite)}</AppText>
              </View>
            ) : null}
          </View>

          <ProgresoAbono
            porcentaje={vm.total > 0 ? (vm.abonado / vm.total) * 100 : 0}
            color={liquidado ? colors.green : colors.accent}
            alto={8}
          />
          <View style={styles.montos}>
            <AppText variant="caption">Abonado {formatPrecio(vm.abonado)}</AppText>
            <AppText variant="caption">Total {formatPrecio(vm.total)}</AppText>
          </View>
          {vencido ? (
            <Banner variant="error">
              La fecha límite ya pasó. Puedes recibir el saldo o cancelar el apartado para liberar
              la mercancía.
            </Banner>
          ) : null}
        </View>

        {/* Artículos */}
        <View style={styles.section}>
          <AppText variant="label">Artículos · {vm.articulos.length}</AppText>
          <View style={styles.card}>
            {vm.articulos.map((a, i) => (
              <View key={`${a.sku}-${i}`} style={styles.itemRow}>
                <View style={styles.flex}>
                  <AppText variant="body" numberOfLines={1}>
                    {a.producto_nombre}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {a.talla} · {a.color} · {a.cantidad} × {formatPrecio(a.precio_unitario)}
                  </AppText>
                </View>
                <AppText variant="bodyMedium" color={colors.text.price}>
                  {formatPrecio(a.subtotal)}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Historial de abonos */}
        <View style={styles.section}>
          <AppText variant="label">Abonos · {vm.abonos.length}</AppText>
          <View style={styles.card}>
            {vm.abonos.length === 0 ? (
              <AppText variant="caption">Aún no hay abonos registrados.</AppText>
            ) : (
              vm.abonos.map((ab) => (
                <View key={ab.id} style={styles.itemRow}>
                  <View style={styles.flex}>
                    <AppText variant="bodyMedium">{ab.metodo}</AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {formatFechaHora(ab.fecha)}
                      {ab.usuario_nombre ? ` · ${ab.usuario_nombre}` : ''}
                    </AppText>
                  </View>
                  <AppText variant="bodyMedium" color={colors.green}>
                    +{formatPrecio(ab.monto)}
                  </AppText>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.card}>
          <ResumenFila etiqueta="Creado" valor={formatFechaHora(cab.creado_en)} />
          {cab.vendedor_nombre ? (
            <ResumenFila etiqueta="Registró" valor={cab.vendedor_nombre} />
          ) : null}
        </View>

        {vm.activo ? (
          <Button
            title="Cancelar apartado"
            variant="ghost"
            onPress={vm.pedirCancelacion}
            loading={vm.cancelando}
            style={styles.cancelar}
          />
        ) : null}
      </ScrollView>

      {vm.activo ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            title="Liquidar"
            variant="secondary"
            fullWidth={false}
            onPress={() => vm.abrirAbono(true)}
            disabled={vm.cancelando}
          />
          <Button
            title="Registrar abono"
            onPress={() => vm.abrirAbono()}
            disabled={vm.cancelando}
            style={styles.flex}
          />
        </View>
      ) : null}

      <AbonoSheet
        visible={vm.abonoAbierto}
        saldo={vm.saldo}
        pagos={vm.pagos}
        activoId={vm.activoId}
        montos={vm.montos}
        sugerencias={vm.sugerencias}
        erroresPago={vm.erroresPago}
        onActivar={vm.activarPago}
        onAgregar={vm.agregarPago}
        onCambiar={vm.actualizarPago}
        onQuitar={vm.quitarPago}
        montoAbono={vm.montoAbono}
        cambio={vm.cambio}
        saldoRestante={vm.saldoRestante}
        liquida={vm.liquida}
        errorPagos={vm.errorPagos}
        error={vm.errorAbono}
        enviando={vm.enviandoAbono}
        puedeConfirmar={vm.puedeAbonar}
        onConfirmar={vm.registrarAbono}
        onCerrar={vm.cerrarAbono}
      />
      <ConfirmSheet
        visible={vm.confirmarCancelacion}
        title={`¿Cancelar el apartado #${cab.id}?`}
        message="La mercancía reservada regresará al inventario disponible. Los abonos ya registrados no se devuelven desde la app."
        cancelLabel="No, conservarlo"
        onCancel={vm.noCancelar}
        confirmLabel="Sí, cancelar apartado"
        onConfirm={vm.cancelar}
      />
    </View>
  );
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
  scroll: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  card: {
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  clienteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  saldoRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  saldo: { fontFamily: fonts.headingExtra, fontSize: 28 },
  vigencia: { alignItems: 'flex-end' },
  montos: { flexDirection: 'row', justifyContent: 'space-between' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cancelar: { alignSelf: 'center' },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
  },
});
