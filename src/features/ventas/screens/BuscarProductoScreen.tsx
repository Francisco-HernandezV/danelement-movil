import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import type { VarianteBusqueda } from '@/data/models/venta';
import { colors, fonts, spacing } from '@/theme';
import { BuscarProductoView } from '@/features/ventas/components/BuscarProductoView';
import { useVentaEnCurso } from '@/features/ventas/context/VentaEnCursoContext';

/**
 * Pantalla de búsqueda de productos (atajo del vendedor).
 * Al tocar una variante disponible, la agrega al carrito de la venta en curso
 * (contexto compartido en `app/(vendedor)/_layout.tsx`) y vuelve al POS.
 */
export function BuscarProductoScreen() {
  const insets = useSafeAreaInsets();
  const { agregarVariante } = useVentaEnCurso();

  const handleSelect = (variante: VarianteBusqueda) => {
    agregarVariante(variante);
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
          Buscar producto
        </AppText>
      </View>

      <View style={styles.body}>
        <BuscarProductoView onSelect={handleSelect} />
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
