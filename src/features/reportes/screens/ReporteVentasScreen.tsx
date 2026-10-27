import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, StateView } from '@/components/ui';
import { formatFechaHora, formatFechaLimite } from '@/data/models/apartado';
import { PERIODOS_REPORTE } from '@/data/models/admin';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { KpiTile } from '@/features/admin/components/KpiTile';
import { BarrasCategorias } from '@/features/reportes/components/BarrasCategorias';
import { GraficaVentas } from '@/features/reportes/components/GraficaVentas';
import { useReporteVentasViewModel } from '@/features/reportes/viewmodels/useReporteVentasViewModel';

/**
 * Reporte de ventas del administrador: periodo y categoría arriba (una fila de
 * filtros cada uno), KPIs, ventas por día/mes, categorías, top productos y
 * últimas ventas con su ticket.
 */
export function ReporteVentasScreen() {
  const insets = useSafeAreaInsets();
  const vm = useReporteVentasViewModel();

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
            Reporte de ventas
          </AppText>
          <AppText variant="caption">
            {vm.rango.inicio === vm.rango.fin
              ? formatFechaLimite(vm.rango.inicio)
              : `${formatFechaLimite(vm.rango.inicio)} – ${formatFechaLimite(vm.rango.fin)}`}
          </AppText>
        </View>
      </View>

      {/* Filtros: periodo y categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsBar}
      >
        {PERIODOS_REPORTE.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            activo={vm.periodo === p.value}
            onPress={() => vm.setPeriodo(p.value)}
          />
        ))}
      </ScrollView>
      {vm.categorias.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsBar}
        >
          <Chip label="Todas" activo={vm.categoriaId === null} onPress={() => vm.setCategoria(null)} />
          {vm.categorias.map((c) => (
            <Chip
              key={c.id}
              label={c.nombre}
              activo={vm.categoriaId === c.id}
              onPress={() => vm.setCategoria(c.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {vm.cargando && !vm.kpis ? (
        <StateView kind="loading" title="Generando reporte..." />
      ) : vm.error && !vm.kpis ? (
        <StateView
          kind="error"
          title="No se pudo generar"
          message={vm.error}
          actionLabel="Reintentar"
          onAction={vm.reintentar}
        />
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
          {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}

          {vm.kpis ? (
            <View style={[styles.hero, vm.cargando ? styles.recargando : null]}>
              <AppText variant="label">Ingresos del periodo</AppText>
              <AppText style={styles.heroMonto} numberOfLines={1} adjustsFontSizeToFit>
                {formatPrecio(vm.kpis.ingresos)}
              </AppText>
            </View>
          ) : null}

          {vm.kpis ? (
            <View style={styles.row}>
              <KpiTile etiqueta="Tickets" valor={String(vm.kpis.tickets)} icono="receipt-outline" />
              <KpiTile etiqueta="Prendas" valor={String(vm.kpis.prendas)} icono="shirt-outline" />
              <KpiTile
                etiqueta="Promedio"
                valor={formatPrecio(vm.kpis.ticketPromedio)}
                icono="calculator-outline"
              />
            </View>
          ) : null}

          <GraficaVentas
            serie={vm.serie}
            seleccion={vm.seleccion}
            onSeleccionar={vm.seleccionar}
            porMes={vm.porMes}
          />

          <BarrasCategorias filas={vm.topCategorias} />

          {/* Top productos (tabla) */}
          <View style={styles.card}>
            <AppText variant="label">Productos más vendidos</AppText>
            {vm.topProductos.length === 0 ? (
              <AppText variant="caption">Sin ventas en el periodo.</AppText>
            ) : (
              vm.topProductos.map((p, i) => (
                <View key={p.nombre} style={styles.filaProducto}>
                  <AppText variant="caption" style={styles.rank}>
                    {i + 1}
                  </AppText>
                  <View style={styles.flex}>
                    <AppText variant="body" numberOfLines={1}>
                      {p.nombre}
                    </AppText>
                    <AppText variant="caption">{p.cantidad} pzs</AppText>
                  </View>
                  <AppText variant="bodyMedium" color={colors.text.price}>
                    {formatPrecio(p.ingresos)}
                  </AppText>
                </View>
              ))
            )}
          </View>

          {/* Últimas ventas + ticket */}
          <View style={styles.card}>
            <AppText variant="label">Últimas ventas</AppText>
            {vm.errorTicket ? <Banner variant="error">{vm.errorTicket}</Banner> : null}
            {vm.errorVentas ? (
              <AppText variant="caption" color={colors.red}>
                {vm.errorVentas}
              </AppText>
            ) : vm.ventas === null ? (
              <AppText variant="caption">Cargando…</AppText>
            ) : vm.ventas.length === 0 ? (
              <AppText variant="caption">Aún no hay ventas registradas.</AppText>
            ) : (
              vm.ventas.map((v) => (
                <Pressable
                  key={v.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Compartir ticket de la venta ${v.id}`}
                  onPress={() => vm.compartirTicket(v.id)}
                  disabled={vm.generandoTicket}
                  style={({ pressed }) => [styles.filaVenta, pressed ? styles.pressed : null]}
                >
                  <View style={styles.flex}>
                    <AppText variant="bodyMedium" numberOfLines={1}>
                      #{v.id} · {v.cliente_nombre?.trim() || 'Venta de mostrador'}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {formatFechaHora(v.creado_en)}
                      {v.vendedor_nombre ? ` · ${v.vendedor_nombre}` : ''}
                    </AppText>
                  </View>
                  <AppText variant="bodyMedium" color={colors.text.main}>
                    {formatPrecio(v.total)}
                  </AppText>
                  <Ionicons name="share-outline" size={18} color={colors.text.muted} />
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Chip({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={activo ? styles.chipActive : styles.chip}
    >
      <AppText variant="caption" style={activo ? styles.chipTextActive : styles.chipText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const chipBase = {
  borderWidth: 1,
  borderRadius: radius.pill,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  back: { padding: spacing.xs },
  title: { fontFamily: fonts.heading },
  // `flexShrink: 0`: un ScrollView trae `flexShrink: 1` y, junto al contenido
  // flexible de abajo, la fila se aplastaba y cortaba los chips (igual que en
  // `CategoryChips` del catálogo).
  chipsBar: { flexGrow: 0, flexShrink: 0 },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  chip: { ...chipBase, borderColor: colors.border, backgroundColor: colors.bg.card },
  chipActive: { ...chipBase, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.text.muted },
  chipTextActive: { color: colors.accent, fontFamily: fonts.bodySemi },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.md },
  hero: {
    gap: 2,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  recargando: { opacity: 0.6 },
  heroMonto: { fontFamily: fonts.headingExtra, fontSize: 48, lineHeight: 56, color: colors.text.price },
  row: { flexDirection: 'row', gap: spacing.sm },
  card: {
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  filaProducto: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { width: 16, textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: fontSize.sm },
  filaVenta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  pressed: { backgroundColor: colors.bg.cardAlt },
});
