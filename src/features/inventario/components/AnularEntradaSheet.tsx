import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, Input } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface AnularEntradaSheetProps {
  visible: boolean;
  folio: number;
  motivo: string;
  onMotivo: (t: string) => void;
  error: string | null;
  anulando: boolean;
  puedeAnular: boolean;
  onAnular: () => void;
  onCerrar: () => void;
}

/**
 * Hoja para anular una entrada: explica el efecto (revierte el stock) y exige
 * el motivo, que queda en la auditoría. La opción segura va arriba.
 */
export function AnularEntradaSheet(props: AnularEntradaSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={props.onCerrar}
    >
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Cerrar" onPress={props.onCerrar} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <AppText variant="subtitle" center>
            Anular la entrada #{props.folio}
          </AppText>
          <AppText variant="caption" center style={styles.mensaje}>
            Se descontarán del inventario las piezas de este lote. No se puede deshacer, y no
            procede si ya se vendieron piezas de este lote.
          </AppText>
          {props.error ? <Banner variant="error">{props.error}</Banner> : null}
          <Input
            label="Motivo (obligatorio)"
            value={props.motivo}
            onChangeText={props.onMotivo}
            placeholder="Ej. Captura duplicada, mercancía devuelta…"
            maxLength={200}
            editable={!props.anulando}
            containerStyle={styles.input}
          />
          <Button title="Conservar la entrada" onPress={props.onCerrar} disabled={props.anulando} />
          <Button
            title="Anular entrada"
            variant="danger"
            onPress={props.onAnular}
            loading={props.anulando}
            disabled={!props.puedeAnular}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: {
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill, backgroundColor: colors.border },
  mensaje: { alignSelf: 'center', maxWidth: 320 },
  input: { marginBottom: 0 },
});
