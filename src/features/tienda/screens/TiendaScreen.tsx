import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Heading } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { PRIVACIDAD } from '@/features/legal/content/privacidad';
import { TERMINOS } from '@/features/legal/content/terminos';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface SeccionLegal {
  titulo: string;
  descripcion: string;
  icono: IconName;
  ruta: Href;
  version: string;
  vigencia: string;
}

const SECCIONES: SeccionLegal[] = [
  {
    titulo: 'Términos y condiciones',
    descripcion: 'Uso de la app, apartados, cambios, garantías y envíos.',
    icono: 'document-text-outline',
    ruta: '/legal/terminos',
    version: TERMINOS.version,
    vigencia: TERMINOS.vigencia,
  },
  {
    titulo: 'Aviso de privacidad',
    descripcion: 'Qué datos usamos, para qué y cómo ejercer tus derechos ARCO.',
    icono: 'shield-checkmark-outline',
    ruta: '/legal/privacidad',
    version: PRIVACIDAD.version,
    vigencia: PRIVACIDAD.vigencia,
  },
];

/** Pestaña Tienda: acceso a los Términos y al Aviso de privacidad. */
export function TiendaScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Heading>Tienda</Heading>
        <AppText variant="caption">Condiciones de la tienda y uso de tus datos.</AppText>
      </View>

      {SECCIONES.map((s) => (
        <Pressable
          key={s.titulo}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${s.titulo}`}
          onPress={() => router.push(s.ruta)}
          style={({ pressed }) => [styles.tarjeta, pressed && styles.pressed]}
        >
          <View style={styles.icono}>
            <Ionicons name={s.icono} size={26} color={colors.accent} />
          </View>
          <View style={styles.textos}>
            <AppText variant="subtitle">{s.titulo}</AppText>
            <AppText variant="caption">{s.descripcion}</AppText>
            <AppText variant="caption" color={colors.text.muted} style={styles.version}>
              Versión {s.version} · {s.vigencia}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.body },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: 4 },
  version: { fontSize: 11 },
  pressed: { opacity: 0.7 },
});
