import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button } from '@/components/ui';
import { nombreCliente } from '@/data/models/cliente';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { VentaCobrada } from '@/features/ventas/viewmodels/useCobroViewModel';
import { ResumenFila } from './ResumenFila';

interface VentaConfirmacionProps {
  venta: VentaCobrada;
  onNuevaVenta: () => void;
  onSalir: () => void;
  /** Descarga el ticket PDF y abre el menú de compartir. */
  onComprobante: () => void;
  generandoComprobante: boolean;
  errorComprobante: string | null;
}

/**
 * Venta ya registrada (el carrito ya se limpió).
 * Muestra folio, desglose de pagos y, en grande, el cambio a entregar.
 */
export function VentaConfirmacion({
  venta,
  onNuevaVenta,
  onSalir,
  onComprobante,
  generandoComprobante,
  errorComprobante,
}: VentaConfirmacionProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color={colors.green} />
        </View>
        <AppText variant="subtitle" center>
          ¡Venta registrada!
        </AppText>
        <AppText variant="caption" center>
          Folio #{venta.ventaId}
        </AppText>

        {venta.cambio > 0 ? (
          <View style={styles.cambio}>
            <AppText variant="label" color={colors.green}>
              Cambio a entregar
            </AppText>
            <AppText style={styles.cambioMonto}>{formatPrecio(venta.cambio)}</AppText>
          </View>
        ) : null}

        <View style={styles.card}>
          <ResumenFila
            etiqueta="Cliente"
            valor={venta.cliente ? nombreCliente(venta.cliente) : 'Venta de mostrador'}
          />
          <ResumenFila
            etiqueta="Artículos"
            valor={`${venta.totalItems} ${venta.totalItems === 1 ? 'artículo' : 'artículos'}`}
          />
          <ResumenFila etiqueta="Total" valor={formatPrecio(venta.total)} destacado />
          <View style={styles.divider} />
          <AppText variant="label">Pagos</AppText>
          {venta.pagos.map((p, i) => (
            <ResumenFila
              key={i}
              etiqueta={p.referencia ? `${p.metodo} · ${p.referencia}` : p.metodo}
              valor={formatPrecio(p.monto)}
            />
          ))}
          <View style={styles.divider} />
          <ResumenFila etiqueta="Cambio" valor={formatPrecio(venta.cambio)} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {errorComprobante ? <Banner variant="error">{errorComprobante}</Banner> : null}
        <Button
          title="Compartir ticket"
          variant="secondary"
          onPress={onComprobante}
          loading={generandoComprobante}
          leftAccessory={<Ionicons name="share-outline" size={18} color={colors.text.main} />}
        />
        <Button title="Nueva venta" onPress={onNuevaVenta} />
        <Button title="Salir del punto de venta" variant="ghost" onPress={onSalir} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  cambio: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  cambioMonto: { fontFamily: fonts.headingExtra, fontSize: fontSize.title, color: colors.green },
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
    gap: spacing.sm,
  },
});
