import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface CardProps extends ViewProps {
  /** Padding interno (por defecto `lg` = 16). Usa `false` para sin padding. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Superficie elevada de la app: fondo de tarjeta, borde sutil y sombra. */
export function Card({ padded = true, style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    boxShadow: '0px 12px 20px rgba(0, 0, 0, 0.5)',
    elevation: 6,
  },
  padded: { padding: spacing.xl },
});
