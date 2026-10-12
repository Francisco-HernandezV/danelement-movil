import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import type { ClienteBusqueda } from '@/data/models/cliente';
import { colors, fonts, spacing } from '@/theme';
import { BuscarClienteView } from '@/features/clientes/components/BuscarClienteView';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';

/**
 * Pantalla de búsqueda de clientes del POS. Al seleccionar un cliente lo
 * asocia a la venta en curso; "venta de mostrador" lo marca como sin cliente.
 */
export function BuscarClienteScreen() {
  const insets = useSafeAreaInsets();
  const { seleccionarCliente, continuarSinCliente } = useVentaEnCurso();

  const handleSelect = (cliente: ClienteBusqueda) => {
    seleccionarCliente(cliente);
    if (router.canGoBack()) router.back();
    else router.replace('/ventas');
  };

  const handleSinCliente = () => {
    continuarSinCliente();
    if (router.canGoBack()) router.back();
    else router.replace('/ventas');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" style={styles.title}>
          Buscar cliente
        </AppText>
      </View>

      <View style={styles.body}>
        <BuscarClienteView onSelect={handleSelect} onContinuarSinCliente={handleSinCliente} />
      </View>
    </View>
  );
}

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
  body: { flex: 1, paddingHorizontal: spacing.lg },
});
