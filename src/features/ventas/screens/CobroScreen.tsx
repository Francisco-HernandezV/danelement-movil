import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, Input, StateView } from '@/components/ui';
import { nombreCliente } from '@/data/models/cliente';
import { formatPrecio } from '@/data/models/producto';
import { METODOS_PAGO, metodoConReferencia, type MetodoPago } from '@/data/models/venta';
import { colors, fonts, radius, spacing } from '@/theme';
import type { PagoCaptura } from '@/features/ventas/viewmodels/cobroCalculo';
import {
  useCobroViewModel,
  type CambiosPago,
} from '@/features/ventas/viewmodels/useCobroViewModel';

/** Regresa a la pantalla principal del POS. */
function volverAlPos() {
  if (router.canGoBack()) router.back();
  else router.replace('/ventas');
}

/**
 * Pantalla de Cobro del POS.
 *
 * Muestra el resumen de la venta en curso y una lista de formas de pago
 * combinables (efectivo, tarjetas, transferencia) con lo pagado, el restante y
 * el cambio. Toda la lógica vive en `useCobroViewModel` / `cobroCalculo`;
 * aquí solo se pinta según su estado (captura → enviando → éxito / error).
 */
export function CobroScreen() {
  const insets = useSafeAreaInsets();
  const vm = useCobroViewModel();

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={volverAlPos}
        disabled={vm.enviando}
        hitSlop={10}
        style={styles.backBtn}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text.main} />
      </Pressable>
      <AppText variant="heading" style={styles.title}>
        {vm.cobrada ? 'Venta registrada' : 'Cobrar'}
      </AppText>
    </View>
  );

  // ── Éxito: el carrito ya se limpió; mostramos los datos congelados. ──
  if (vm.cobrada) {
    const c = vm.cobrada;
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        {header}
        <View style={styles.successBody}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color={colors.green} />
          </View>
          <AppText variant="subtitle" center>
            ¡Venta registrada!
          </AppText>
          <AppText variant="caption" center>
            Folio #{c.ventaId}
          </AppText>

          <View style={styles.card}>
            <ResumenFila etiqueta="Cliente" valor={c.cliente ? nombreCliente(c.cliente) : 'Venta de mostrador'} />
            <ResumenFila
              etiqueta="Artículos"
              valor={`${c.totalItems} ${c.totalItems === 1 ? 'artículo' : 'artículos'}`}
            />
            <ResumenFila etiqueta="Total" valor={formatPrecio(c.total)} destacado />
            <View style={styles.divider} />
            <AppText variant="label">Pagos</AppText>
            {c.pagos.map((p, i) => (
              <ResumenFila
                key={i}
                etiqueta={p.referencia ? `${p.metodo} · ${p.referencia}` : p.metodo}
                valor={formatPrecio(p.monto)}
              />
            ))}
            <View style={styles.divider} />
            <ResumenFila etiqueta="Cambio a entregar" valor={formatPrecio(c.cambio)} destacado />
          </View>
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button title="Nueva venta" onPress={volverAlPos} />
        </View>
      </View>
    );
  }

  // ── Llegó sin productos (p. ej. por enlace directo). ──
  if (vm.carritoVacio) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        {header}
        <StateView
          kind="empty"
          title="No hay productos por cobrar"
          message="Agrega productos a la venta antes de cobrar."
          actionLabel="Volver al punto de venta"
          onAction={volverAlPos}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
        {header}

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}

          {/* Resumen de la venta */}
          <View style={styles.section}>
            <AppText variant="label">Resumen</AppText>
            <View style={styles.card}>
              <ResumenFila
                etiqueta="Cliente"
                valor={vm.cliente ? nombreCliente(vm.cliente) : 'Venta de mostrador'}
              />
              <View style={styles.divider} />
              {vm.items.map((it) => (
                <View key={it.variante_id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <AppText variant="body" numberOfLines={1}>
                      {it.producto_nombre}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {it.talla} · {it.color} · {it.cantidad} × {formatPrecio(it.precio_unitario)}
                    </AppText>
                  </View>
                  <AppText variant="bodyMedium" style={styles.itemTotal}>
                    {formatPrecio(it.precio_unitario * it.cantidad)}
                  </AppText>
                </View>
              ))}
              <View style={styles.divider} />
              <ResumenFila
                etiqueta={`Total (${vm.totalItems} ${vm.totalItems === 1 ? 'artículo' : 'artículos'})`}
                valor={formatPrecio(vm.total)}
                destacado
              />
            </View>
          </View>

          {/* Formas de pago (combinables) */}
          <View style={styles.section}>
            <AppText variant="label">Formas de pago</AppText>
            {vm.pagos.map((p, i) => (
              <PagoFila
                key={p.id}
                numero={i + 1}
                pago={p}
                error={vm.erroresPago[p.id]}
                deshabilitado={vm.enviando}
                onCambiar={vm.actualizarPago}
                onQuitar={vm.quitarPago}
              />
            ))}
            <Button
              title="Agregar forma de pago"
              variant="secondary"
              onPress={vm.agregarPago}
              disabled={vm.enviando}
              leftAccessory={<Ionicons name="add" size={18} color={colors.text.main} />}
            />
          </View>

          {/* Totales del cobro */}
          <View style={styles.card}>
            <ResumenFila etiqueta="Total" valor={formatPrecio(vm.total)} />
            <ResumenFila etiqueta="Pagado" valor={formatPrecio(vm.pagado)} />
            <View style={styles.resumenFila}>
              <AppText variant="caption">Restante</AppText>
              <AppText
                variant="bodyMedium"
                style={vm.restante > 0 ? styles.restantePendiente : styles.restanteCubierto}
              >
                {formatPrecio(vm.restante)}
              </AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.resumenFila}>
              <AppText variant="bodyMedium">Cambio</AppText>
              <AppText variant="subtitle" style={styles.cambio}>
                {formatPrecio(vm.cambio)}
              </AppText>
            </View>
          </View>

          {vm.errorPagos ? <Banner variant="error">{vm.errorPagos}</Banner> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            title={`Confirmar cobro · ${formatPrecio(vm.total)}`}
            onPress={vm.confirmar}
            loading={vm.enviando}
            disabled={!vm.puedeConfirmar}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

interface PagoFilaProps {
  numero: number;
  pago: PagoCaptura;
  error?: string;
  deshabilitado: boolean;
  onCambiar: (id: number, cambios: CambiosPago) => void;
  onQuitar: (id: number) => void;
}

/** Una forma de pago editable: método, monto, referencia opcional y quitar. */
function PagoFila({ numero, pago, error, deshabilitado, onCambiar, onQuitar }: PagoFilaProps) {
  const conReferencia = metodoConReferencia(pago.metodo);
  const esTransferencia = pago.metodo === 'Transferencia';
  const elegir = (m: MetodoPago) => onCambiar(pago.id, { metodo: m });

  return (
    <View style={styles.card}>
      <View style={styles.pagoHeader}>
        <AppText variant="label">Pago {numero}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar pago ${numero}`}
          onPress={() => onQuitar(pago.id)}
          disabled={deshabilitado}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Ionicons name="trash-outline" size={16} color={colors.text.main} />
        </Pressable>
      </View>

      <View style={styles.chips}>
        {METODOS_PAGO.map((m) => {
          const activo = pago.metodo === m.value;
          return (
            <Pressable
              key={m.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo, disabled: deshabilitado }}
              accessibilityLabel={m.value}
              disabled={deshabilitado}
              onPress={() => elegir(m.value)}
              style={activo ? styles.chipActive : styles.chip}
            >
              <AppText variant="caption" style={activo ? styles.chipTextActive : styles.chipText}>
                {m.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Input
        value={pago.montoTexto}
        onChangeText={(t) => onCambiar(pago.id, { montoTexto: t })}
        placeholder="0.00"
        keyboardType="decimal-pad"
        editable={!deshabilitado}
        error={error}
        accessibilityLabel={`Monto del pago ${numero}`}
        leftAccessory={<AppText variant="bodyMedium">$</AppText>}
        containerStyle={styles.inputContainer}
      />
      {conReferencia ? (
        <Input
          value={pago.referencia}
          onChangeText={(t) => onCambiar(pago.id, { referencia: t })}
          placeholder={esTransferencia ? 'Folio (opcional)' : 'Últimos 4 dígitos (opcional)'}
          keyboardType={esTransferencia ? 'default' : 'number-pad'}
          maxLength={esTransferencia ? 30 : 4}
          editable={!deshabilitado}
          accessibilityLabel={`Referencia del pago ${numero}`}
          containerStyle={styles.inputContainer}
        />
      ) : null}
    </View>
  );
}

interface ResumenFilaProps {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}

function ResumenFila({ etiqueta, valor, destacado = false }: ResumenFilaProps) {
  return (
    <View style={styles.resumenFila}>
      <AppText variant={destacado ? 'bodyMedium' : 'caption'}>{etiqueta}</AppText>
      <AppText
        variant={destacado ? 'subtitle' : 'bodyMedium'}
        numberOfLines={1}
        style={destacado ? styles.valorDestacado : styles.valor}
      >
        {valor}
      </AppText>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  section: { gap: spacing.sm },
  card: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.border },
  resumenFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  valor: { flexShrink: 1, textAlign: 'right' },
  valorDestacado: { flexShrink: 1, textAlign: 'right', color: colors.text.price },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemInfo: { flex: 1 },
  itemTotal: { color: colors.text.price },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { ...chipBase, borderColor: colors.border, backgroundColor: colors.bg.card },
  chipActive: { ...chipBase, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.text.muted },
  chipTextActive: { color: colors.accent, fontFamily: fonts.bodySemi },
  pagoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restantePendiente: { color: colors.red },
  restanteCubierto: { color: colors.green },
  inputContainer: { marginBottom: 0 },
  cambio: { color: colors.green },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
  },
  successBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
