import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';

interface AccesoDirectoProps {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  onPress?: () => void;
  /** Módulo aún no disponible: se muestra deshabilitado con la leyenda. */
  proximamente?: boolean;
}

/** Tarjeta de acceso a un módulo (2 por fila). */
export function AccesoDirecto({ icono, titulo, onPress, proximamente = false }: AccesoDirectoProps) {
  const deshabilitado = proximamente || !onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={proximamente ? `${titulo} (próximamente)` : titulo}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        pressed ? styles.pressed : null,
        deshabilitado ? styles.off : null,
      ]}
    >
      <View style={styles.icon}>
        <Ionicons name={icono} size={20} color={colors.accent} />
      </View>
      <AppText variant="bodyMedium" numberOfLines={2} style={styles.titulo}>
        {titulo}
      </AppText>
      {proximamente ? <AppText variant="caption">Próximamente</AppText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 96,
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.bg.cardAlt },
  off: { opacity: 0.55 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: fonts.bodySemi },
});
