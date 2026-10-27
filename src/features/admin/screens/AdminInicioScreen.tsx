import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, StateView } from '@/components/ui';
import { formatFechaHora } from '@/data/models/apartado';
import { textoPrendas, textoTickets, UMBRAL_STOCK_BAJO } from '@/data/models/admin';
import { formatPrecio, precioNumero } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { AccesoDirecto } from '@/features/admin/components/AccesoDirecto';
import { KpiTile } from '@/features/admin/components/KpiTile';
import { useAdminInicioViewModel } from '@/features/admin/viewmodels/useAdminInicioViewModel';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fechaDeHoy(): string {
  const d = new Date();
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/**
 * Inicio del administrador: ventas (hoy y 30 días), caja, alertas de stock y
 * apartados vencidos, y accesos directos a los módulos.
 */
export function AdminInicioScreen() {
  const insets = useSafeAreaInsets();
  const vm = useAdminInicioViewModel();

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
        <View style={styles.flex}>
          <AppText variant="heading" style={styles.title}>
            Hola, {vm.nombre}
          </AppText>
          <AppText variant="caption">Panel de administración · {fechaDeHoy()}</AppText>
        </View>
      </View>

      {vm.cargando ? (
        <StateView kind="loading" title="Cargando el panel..." />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.refrescando}
              onRefresh={vm.refrescar}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.bg.card}
            />
          }
        >
          {/* Ventas (toca para abrir el reporte completo) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir reporte de ventas"
            onPress={vm.irAReportes}
            style={({ pressed }) => [styles.hero, pressed ? styles.pressed : null]}
          >
            <AppText variant="label">Ventas · últimos 30 días</AppText>
            {vm.mes ? (
              <>
                <AppText style={styles.heroMonto}>{formatPrecio(vm.mes.ingresos)}</AppText>
                <AppText variant="caption">
                  {textoTickets(vm.mes.tickets)} · {textoPrendas(vm.mes.prendas)} · promedio{' '}
                  {formatPrecio(vm.mes.ticketPromedio)}
                </AppText>
              </>
            ) : (
              <AppText variant="caption" color={colors.red}>
                {vm.errorMes ?? 'Sin datos.'}
              </AppText>
            )}
          </Pressable>

          <View style={styles.row}>
            <KpiTile
              etiqueta="Vendido hoy"
              valor={vm.hoy ? formatPrecio(vm.hoy.ingresos) : '—'}
              detalle={vm.hoy ? textoPrendas(vm.hoy.prendas) : (vm.errorHoy ?? undefined)}
              icono="trending-up"
            />
            <KpiTile
              etiqueta="Tickets hoy"
              valor={vm.hoy ? String(vm.hoy.tickets) : '—'}
              detalle={vm.hoy && vm.hoy.tickets > 0 ? `prom. ${formatPrecio(vm.hoy.ticketPromedio)}` : undefined}
              icono="receipt-outline"
            />
          </View>

          {/* Caja */}
          <View style={styles.card}>
            <View style={styles.cajaRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: vm.caja?.abierta ? colors.green : colors.red },
                ]}
              />
              <View style={styles.flex}>
                <AppText variant="bodyMedium" style={styles.semi}>
                  {vm.caja ? (vm.caja.abierta ? 'Caja abierta' : 'Caja cerrada') : 'Caja'}
                </AppText>
                <AppText variant="caption">
                  {vm.errorCaja
                    ? vm.errorCaja
                    : vm.caja?.abierta
                      ? `Desde ${formatFechaHora(vm.caja.fecha_apertura)} · fondo ${formatPrecio(vm.caja.monto_inicial ?? 0)}`
                      : 'No se pueden cobrar ventas ni recibir abonos hasta abrirla.'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Alertas */}
          <AppText variant="label">Alertas</AppText>
          <View style={styles.card}>
            <View style={styles.alertaHeader}>
              <Ionicons name="alert-circle" size={20} color={colors.yellow} />
              <AppText variant="bodyMedium" style={[styles.flex, styles.semi]}>
                Stock bajo (≤ {UMBRAL_STOCK_BAJO})
              </AppText>
              <AppText variant="subtitle" color={vm.stockBajo?.length ? colors.yellow : colors.text.muted}>
                {vm.stockBajo ? vm.stockBajo.length : '—'}
              </AppText>
            </View>
            {vm.errorStock ? (
              <AppText variant="caption" color={colors.red}>
                {vm.errorStock}
              </AppText>
            ) : vm.stockBajo && vm.stockBajo.length > 0 ? (
              vm.stockBajo.slice(0, 5).map((v) => (
                <View key={v.id} style={styles.itemRow}>
                  <View style={styles.flex}>
                    <AppText variant="body" numberOfLines={1}>
                      {v.producto_nombre}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {v.talla} · {v.color}
                      {v.sku ? ` · ${v.sku}` : ''}
                    </AppText>
                  </View>
                  <AppText
                    variant="bodyMedium"
                    color={Number(v.stock) <= 0 ? colors.red : colors.yellow}
                  >
                    {Number(v.stock) <= 0 ? 'Agotado' : `${v.stock} pzs`}
                  </AppText>
                </View>
              ))
            ) : (
              <AppText variant="caption">Todo el inventario está por encima del mínimo.</AppText>
            )}
            {vm.stockBajo && vm.stockBajo.length > 5 ? (
              <AppText variant="caption">y {vm.stockBajo.length - 5} variantes más…</AppText>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver apartados"
            onPress={vm.irAApartados}
            style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
          >
            <View style={styles.alertaHeader}>
              <Ionicons name="time" size={20} color={colors.red} />
              <AppText variant="bodyMedium" style={[styles.flex, styles.semi]}>
                Apartados vencidos
              </AppText>
              <AppText variant="subtitle" color={vm.vencidos?.length ? colors.red : colors.text.muted}>
                {vm.vencidos ? vm.vencidos.length : '—'}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            </View>
            <AppText variant="caption" color={vm.errorVencidos ? colors.red : undefined}>
              {vm.errorVencidos
                ? vm.errorVencidos
                : vm.vencidos && vm.vencidos.length > 0
                  ? `Saldo por cobrar ${formatPrecio(
                      vm.vencidos.reduce((s, a) => s + precioNumero(a.saldo), 0),
                    )}: recibe el pago o cancélalos para liberar la mercancía.`
                  : 'No hay apartados vencidos.'}
            </AppText>
          </Pressable>

          {/* Accesos directos */}
          <AppText variant="label">Accesos directos</AppText>
          <View style={styles.grid}>
            <AccesoDirecto icono="cart" titulo="Punto de venta" onPress={vm.irAVentas} />
            <AccesoDirecto icono="bookmark" titulo="Apartados" onPress={vm.irAApartados} />
            <AccesoDirecto icono="bar-chart" titulo="Reporte de ventas" onPress={vm.irAReportes} />
            <AccesoDirecto icono="cube" titulo="Inventario y entradas" proximamente />
          </View>
        </ScrollView>
      )}
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
  title: { fontFamily: fonts.heading },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  hero: {
    gap: 2,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  heroMonto: { fontFamily: fonts.headingExtra, fontSize: fontSize.title, color: colors.text.price },
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.bg.cardAlt },
  cajaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  alertaHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
