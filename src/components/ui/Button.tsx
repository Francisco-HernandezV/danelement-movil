import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { AppText } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** Ocupa todo el ancho disponible (por defecto `true`). */
  fullWidth?: boolean;
  /** Elemento opcional a la izquierda del texto (p. ej. un icono). */
  leftAccessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftAccessory,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !isDisabled ? { backgroundColor: palette.bgPressed } : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.content}>
          {leftAccessory ? <View style={styles.accessory}>{leftAccessory}</View> : null}
          <AppText style={[styles.label, { color: palette.text }]}>{title}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; bgPressed: string; border: string; text: string }
> = {
  primary: {
    bg: colors.accent,
    bgPressed: colors.accentHover,
    border: colors.accent,
    text: colors.text.main,
  },
  secondary: {
    bg: 'transparent',
    bgPressed: 'rgba(255,255,255,0.06)',
    border: colors.border,
    text: colors.text.main,
  },
  danger: {
    bg: colors.red,
    bgPressed: '#dc2626',
    border: colors.red,
    text: colors.text.main,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: colors.accentSoft,
    border: 'transparent',
    text: colors.accent,
  },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  accessory: { marginRight: spacing.sm },
  label: {
    fontFamily: fonts.headingSemi,
    fontSize: fontSize.md,
    letterSpacing: 0.3,
  },
});
