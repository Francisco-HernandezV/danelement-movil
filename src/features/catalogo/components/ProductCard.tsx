import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Producto } from '@/data/models/producto';
import { formatPrecio } from '@/data/models/producto';
import { cldUrl } from '@/utils/cloudinary';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface ProductCardProps {
  producto: Producto;
}

/** Tarjeta de producto: foto, nombre y precio (en rojo). Navega al detalle. */
export function ProductCard({ producto }: ProductCardProps) {
  const uri = cldUrl(producto.imagen, 'w_600,h_600,c_fill');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/producto/${producto.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View style={styles.info}>
        <AppText variant="bodyMedium" numberOfLines={2} style={styles.nombre}>
          {producto.nombre}
        </AppText>
        <AppText style={styles.precio}>{formatPrecio(producto.precio_base)}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.bg.cardAlt,
  },
  info: { padding: spacing.md, gap: spacing.xs },
  nombre: { minHeight: 38 },
  precio: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: colors.red,
  },
});
