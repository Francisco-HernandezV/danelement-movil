import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ImagenProducto } from '@/data/models/producto';
import { cldUrl } from '@/utils/cloudinary';
import { colors, radius, spacing } from '@/theme';

interface ProductGalleryProps {
  imagenes: ImagenProducto[];
  nombre: string;
}

/** Galería del detalle: imagen principal + tira de miniaturas (si hay varias). */
export function ProductGallery({ imagenes, nombre }: ProductGalleryProps) {
  const [activo, setActivo] = useState(0);
  const principal = imagenes[activo]?.url;

  return (
    <View style={styles.wrap}>
      <View style={styles.mainWrap}>
        <Image
          source={{ uri: cldUrl(principal, 'w_1000') }}
          style={styles.main}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          accessibilityLabel={nombre}
        />
      </View>

      {imagenes.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbs}
          contentContainerStyle={styles.thumbsContent}
        >
          {imagenes.map((img, idx) => (
            <Pressable
              key={img.id}
              accessibilityRole="button"
              accessibilityLabel={`Ver imagen ${idx + 1}`}
              accessibilityState={{ selected: idx === activo }}
              onPress={() => setActivo(idx)}
              style={[styles.thumb, idx === activo && styles.thumbActive]}
            >
              <Image
                source={{ uri: cldUrl(img.url, 'w_160,h_160,c_fill') }}
                style={styles.thumbImg}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  mainWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.cardAlt,
    overflow: 'hidden',
  },
  main: { width: '100%', height: '100%' },
  thumbs: { flexGrow: 0 },
  thumbsContent: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumbActive: { borderColor: colors.accent },
  thumbImg: { width: '100%', height: '100%' },
});
