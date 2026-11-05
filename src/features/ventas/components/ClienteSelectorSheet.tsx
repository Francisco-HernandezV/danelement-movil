import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import type { ClienteBusqueda } from '@/data/models/cliente';
import { colors, fonts, spacing } from '@/theme';
import { BuscarClienteView } from '@/features/clientes/components/BuscarClienteView';

interface ClienteSelectorSheetProps {
  visible: boolean;
  onElegir: (cliente: ClienteBusqueda) => void;
  /** "Continuar sin cliente". Omitir cuando el cliente es obligatorio (apartados). */
  onMostrador?: () => void;
  onCerrar: () => void;
  /** Título de la hoja (por defecto "Cliente de la venta"). */
  titulo?: string;
}

/**
 * Hoja para asociar un cliente a la venta (opcional). Reutiliza
 * `BuscarClienteView`; "Continuar sin cliente" deja la venta de mostrador.
 * En iOS se presenta como page sheet (se cierra deslizando hacia abajo); en
 * Android, el botón atrás la cierra sin salir del POS.
 */
export function ClienteSelectorSheet({
  visible,
  onElegir,
  onMostrador,
  onCerrar,
  titulo = 'Cliente de la venta',
}: ClienteSelectorSheetProps) {
  const insets = useSafeAreaInsets();
  const esIOS = Platform.OS === 'ios';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={esIOS ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onCerrar}
    >
      <View
        style={[
          styles.root,
          { paddingTop: esIOS ? spacing.lg : insets.top + spacing.sm, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <AppText variant="subtitle" style={styles.title}>
            {titulo}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={onCerrar}
            hitSlop={10}
          >
            <Ionicons name="close" size={24} color={colors.text.main} />
          </Pressable>
        </View>
        <View style={styles.body}>
          <BuscarClienteView onSelect={onElegir} onContinuarSinCliente={onMostrador} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { flex: 1, fontFamily: fonts.heading },
  body: { flex: 1, paddingHorizontal: spacing.lg },
});
