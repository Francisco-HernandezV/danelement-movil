import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';
import { Button } from './Button';
import { AppText } from './Typography';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Acción principal (p. ej. "Seguir con la venta"). Es la opción segura. */
  cancelLabel: string;
  onCancel: () => void;
  /** Acción que descarta / confirma (p. ej. "Salir y descartar"). */
  confirmLabel: string;
  onConfirm: () => void;
  /** Pinta la acción de confirmar en rojo. Por defecto `true`. */
  destructive?: boolean;
}

/**
 * Hoja inferior de confirmación (bottom sheet) para acciones que pierden
 * información. Funciona igual en Android e iOS:
 * - tocar el fondo o el botón atrás de Android equivale a cancelar;
 * - la opción segura (cancelar) va arriba y resaltada.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  cancelLabel,
  onCancel,
  confirmLabel,
  onConfirm,
  destructive = true,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <AppText variant="subtitle" center>
            {title}
          </AppText>
          {message ? (
            <AppText variant="caption" center style={styles.message}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <Button title={cancelLabel} onPress={onCancel} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'secondary'}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
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
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  message: { alignSelf: 'center', maxWidth: 320 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
