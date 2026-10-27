import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button } from '@/components/ui';
import { nombreCliente, type ClienteBusqueda } from '@/data/models/cliente';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import {
  useCobroViewModel,
  type VentaCobrada,
} from '@/features/ventas/viewmodels/useCobroViewModel';
import { PagoEditor } from './PagoEditor';
import { PagoResumido } from './PagoResumido';

interface VentaPagoProps {
  cliente: ClienteBusqueda | null;
  totalItems: number;
  onCobrada: (venta: VentaCobrada) => void;
}

/**
 * Vista de cobro. Arriba el total a pagar; luego los pagos: uno abierto para
 * editar y los demás en una línea. Abajo, fijo, Pagado / Restante / Cambio y
 * el botón Confirmar. La lógica vive en `useCobroViewModel`.
 */
export function VentaPago({ cliente, totalItems, onCobrada }: VentaPagoProps) {
  const insets = useSafeAreaInsets();
  const vm = useCobroViewModel({ onCobrada });
  const varios = vm.pagos.length > 1;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AppText variant="label">Total a pagar</AppText>
          <AppText style={styles.heroMonto}>{formatPrecio(vm.total)}</AppText>
          <AppText variant="caption">
            {cliente ? nombreCliente(cliente) : 'Venta de mostrador'} · {totalItems}{' '}
            {totalItems === 1 ? 'artículo' : 'artículos'}
          </AppText>
        </View>

        {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}

        <View style={styles.pagos}>
          {vm.pagos.map((p) =>
            p.id === vm.activoId ? (
              <PagoEditor
                key={p.id}
                pago={p}
                error={vm.erroresPago[p.id]}
                sugerencias={vm.sugerencias[p.id]}
                puedeQuitar={varios}
                deshabilitado={vm.enviando}
                onCambiar={vm.actualizarPago}
                onQuitar={vm.quitarPago}
              />
            ) : (
              <PagoResumido
                key={p.id}
                pago={p}
                monto={vm.montos[p.id] ?? null}
                deshabilitado={vm.enviando}
                onEditar={vm.activarPago}
                onQuitar={vm.quitarPago}
              />
            ),
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => vm.agregarPago()}
            disabled={vm.enviando}
            hitSlop={6}
            style={({ pressed }) => [styles.agregar, pressed ? styles.agregarPressed : null]}
          >
            <Ionicons name="add" size={18} color={colors.accent} />
            <AppText variant="bodyMedium" color={colors.accent} style={styles.agregarText}>
              {vm.pagos.length === 0 ? 'Agregar forma de pago' : 'Dividir con otra forma de pago'}
            </AppText>
          </Pressable>
        </View>

        {vm.errorPagos ? <Banner variant="error">{vm.errorPagos}</Banner> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.totales}>
          <Total etiqueta="Pagado" valor={formatPrecio(vm.pagado)} />
          <Total
            etiqueta="Restante"
            valor={formatPrecio(vm.restante)}
            color={vm.restante > 0 ? colors.red : colors.text.muted}
          />
          <Total
            etiqueta="Cambio"
            valor={formatPrecio(vm.cambio)}
            color={vm.cambio > 0 ? colors.green : colors.text.muted}
          />
        </View>
        <Button
          title={vm.restante > 0 ? `Faltan ${formatPrecio(vm.restante)}` : 'Confirmar pago'}
          onPress={vm.confirmar}
          loading={vm.enviando}
          disabled={!vm.puedeConfirmar}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Total({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <View style={styles.total}>
      <AppText variant="caption">{etiqueta}</AppText>
      <AppText variant="bodyMedium" color={color} numberOfLines={1}>
        {valor}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  heroMonto: {
    fontFamily: fonts.headingExtra,
    fontSize: fontSize.title,
    color: colors.text.price,
  },
  pagos: { gap: spacing.sm },
  agregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  agregarPressed: { backgroundColor: colors.accentSoft },
  agregarText: { fontFamily: fonts.bodySemi },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
    gap: spacing.md,
  },
  totales: { flexDirection: 'row', gap: spacing.sm },
  total: { flex: 1, alignItems: 'center', gap: 2 },
});
