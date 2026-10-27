import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Input } from '@/components/ui';
import { metodoConReferencia, type MetodoPago } from '@/data/models/venta';
import { colors, fonts, radius, spacing } from '@/theme';
import type { PagoCaptura } from '@/features/ventas/viewmodels/cobroCalculo';
import type { CambiosPago, SugerenciaMonto } from '@/features/ventas/viewmodels/useCobroViewModel';
import { MetodoPagoSelector } from './MetodoPagoSelector';

interface PagoEditorProps {
  pago: PagoCaptura;
  error?: string;
  /** Atajos de monto (solo efectivo): "Exacto" y billetes sugeridos. */
  sugerencias?: SugerenciaMonto[];
  /** Muestra el botón de quitar (cuando hay más de un pago). */
  puedeQuitar: boolean;
  deshabilitado: boolean;
  onCambiar: (id: number, cambios: CambiosPago) => void;
  onQuitar: (id: number) => void;
}

/**
 * El pago que se está editando: método (selector segmentado), monto con
 * atajos de billetes en efectivo y referencia opcional en una sola línea.
 * Solo hay uno abierto a la vez; los demás se ven con `PagoResumido`.
 */
export function PagoEditor({
  pago,
  error,
  sugerencias,
  puedeQuitar,
  deshabilitado,
  onCambiar,
  onQuitar,
}: PagoEditorProps) {
  const esEfectivo = pago.metodo === 'Efectivo';
  const esTransferencia = pago.metodo === 'Transferencia';
  const elegir = (m: MetodoPago) => onCambiar(pago.id, { metodo: m });

  return (
    <View style={styles.card}>
      <MetodoPagoSelector value={pago.metodo} onChange={elegir} disabled={deshabilitado} />

      <View style={styles.montoRow}>
        <Input
          value={pago.montoTexto}
          onChangeText={(t) => onCambiar(pago.id, { montoTexto: t })}
          placeholder="0.00"
          keyboardType="decimal-pad"
          editable={!deshabilitado}
          error={error}
          accessibilityLabel={esEfectivo ? 'Efectivo recibido' : `Monto con ${pago.metodo}`}
          leftAccessory={
            <AppText variant="caption" style={styles.prefijo}>
              {esEfectivo ? 'Recibido $' : 'Monto $'}
            </AppText>
          }
          containerStyle={styles.montoInput}
        />
        {puedeQuitar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar pago con ${pago.metodo}`}
            onPress={() => onQuitar(pago.id)}
            disabled={deshabilitado}
            hitSlop={8}
            style={styles.quitar}
          >
            <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
          </Pressable>
        ) : null}
      </View>

      {esEfectivo && sugerencias && sugerencias.length > 0 ? (
        <View style={styles.billetes}>
          {sugerencias.map((s) => {
            const activo = pago.montoTexto === s.texto;
            return (
              <Pressable
                key={s.etiqueta}
                accessibilityRole="button"
                accessibilityLabel={`Recibido ${s.etiqueta}`}
                disabled={deshabilitado}
                onPress={() => onCambiar(pago.id, { montoTexto: s.texto })}
                style={activo ? styles.billeteActive : styles.billete}
              >
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={activo ? styles.billeteTextActive : styles.billeteText}
                >
                  {s.etiqueta}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {metodoConReferencia(pago.metodo) ? (
        <Input
          value={pago.referencia}
          onChangeText={(t) => onCambiar(pago.id, { referencia: t })}
          placeholder={esTransferencia ? 'Folio de la transferencia (opcional)' : 'Últimos 4 dígitos (opcional)'}
          keyboardType={esTransferencia ? 'default' : 'number-pad'}
          maxLength={esTransferencia ? 30 : 4}
          editable={!deshabilitado}
          accessibilityLabel={`Referencia del pago con ${pago.metodo}`}
          containerStyle={styles.refInput}
        />
      ) : null}
    </View>
  );
}

const billeteBase = {
  flex: 1,
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: radius.sm,
  paddingVertical: spacing.sm,
} as const;

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  montoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  montoInput: { flex: 1, marginBottom: 0 },
  prefijo: { color: colors.text.muted },
  quitar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billetes: { flexDirection: 'row', gap: spacing.xs },
  billete: { ...billeteBase, borderColor: colors.border, backgroundColor: colors.bg.cardAlt },
  billeteActive: { ...billeteBase, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  billeteText: { color: colors.text.main },
  billeteTextActive: { color: colors.accent, fontFamily: fonts.bodySemi },
  refInput: { marginBottom: 0 },
});
