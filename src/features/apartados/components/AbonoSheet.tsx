import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import type { MetodoPago } from '@/data/models/venta';
import { colors, fonts, radius, spacing } from '@/theme';
import { PagoEditor } from '@/features/ventas/components/PagoEditor';
import { PagoResumido } from '@/features/ventas/components/PagoResumido';
import type { PagoCaptura } from '@/features/ventas/viewmodels/cobroCalculo';
import type { CambiosPago, SugerenciaMonto } from '@/features/ventas/viewmodels/usePagosCombinados';

interface AbonoSheetProps {
  visible: boolean;
  saldo: number;

  // Pagos (uno o varios métodos)
  pagos: PagoCaptura[];
  activoId: number | null;
  montos: Record<number, number | null>;
  sugerencias: Record<number, SugerenciaMonto[]>;
  erroresPago: Record<number, string>;
  onActivar: (id: number) => void;
  onAgregar: (metodo?: MetodoPago) => void;
  onCambiar: (id: number, cambios: CambiosPago) => void;
  onQuitar: (id: number) => void;

  // Totales
  montoAbono: number;
  cambio: number;
  saldoRestante: number;
  liquida: boolean;
  errorPagos: string | null;

  // Envío
  error: string | null;
  enviando: boolean;
  puedeConfirmar: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

/**
 * Hoja inferior para abonar o liquidar con UNO O VARIOS métodos (efectivo,
 * débito, crédito, transferencia). Mismo patrón que el cobro del POS: un pago
 * abierto para editar, los demás en una línea; el efectivo puede dar cambio.
 * Tocar el fondo / atrás la cierra.
 */
export function AbonoSheet(props: AbonoSheetProps) {
  const insets = useSafeAreaInsets();
  const varios = props.pagos.length > 1;

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={props.onCerrar}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={props.onCerrar}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <AppText variant="subtitle">Registrar abono</AppText>
            <AppText variant="caption">
              Saldo{' '}
              <AppText variant="bodyMedium" color={colors.text.price}>
                {formatPrecio(props.saldo)}
              </AppText>
            </AppText>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {props.error ? <Banner variant="error">{props.error}</Banner> : null}

            {props.pagos.map((p) =>
              p.id === props.activoId ? (
                <PagoEditor
                  key={p.id}
                  pago={p}
                  error={props.erroresPago[p.id]}
                  sugerencias={props.sugerencias[p.id]}
                  puedeQuitar={varios}
                  mostrarReferencia={false}
                  deshabilitado={props.enviando}
                  onCambiar={props.onCambiar}
                  onQuitar={props.onQuitar}
                />
              ) : (
                <PagoResumido
                  key={p.id}
                  pago={p}
                  monto={props.montos[p.id] ?? null}
                  deshabilitado={props.enviando}
                  onEditar={props.onActivar}
                  onQuitar={props.onQuitar}
                />
              ),
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => props.onAgregar()}
              disabled={props.enviando}
              hitSlop={6}
              style={({ pressed }) => [styles.agregar, pressed ? styles.agregarPressed : null]}
            >
              <Ionicons name="add" size={18} color={colors.accent} />
              <AppText variant="bodyMedium" color={colors.accent} style={styles.agregarText}>
                {props.pagos.length === 0 ? 'Agregar forma de pago' : 'Dividir con otra forma de pago'}
              </AppText>
            </Pressable>

            {props.errorPagos ? <Banner variant="error">{props.errorPagos}</Banner> : null}
          </ScrollView>

          <View style={styles.totales}>
            <Total etiqueta="Abono" valor={formatPrecio(props.montoAbono)} />
            <Total
              etiqueta="Cambio"
              valor={formatPrecio(props.cambio)}
              color={props.cambio > 0 ? colors.green : colors.text.muted}
            />
            <Total
              etiqueta="Saldo después"
              valor={formatPrecio(props.saldoRestante)}
              color={props.liquida ? colors.green : colors.text.price}
            />
          </View>

          <Button
            title={props.liquida ? 'Abonar y liquidar' : 'Registrar abono'}
            onPress={props.onConfirmar}
            loading={props.enviando}
            disabled={!props.puedeConfirmar}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.sm },
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
  totales: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  total: { flex: 1, alignItems: 'center', gap: 2 },
});
