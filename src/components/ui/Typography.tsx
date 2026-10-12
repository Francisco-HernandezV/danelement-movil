import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts, fontSize } from '@/theme';

export type TextVariant =
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyMedium'
  | 'label'
  | 'caption'
  | 'link';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  center?: boolean;
}

/**
 * Texto base de la app. Aplica Montserrat a títulos y Poppins al cuerpo, de
 * modo que ninguna pantalla tenga que recordar los `fontFamily` a mano.
 */
export function AppText({ variant = 'body', color, center, style, ...rest }: AppTextProps) {
  return (
    <Text
      style={[
        styles[variant],
        color ? { color } : null,
        center ? styles.center : null,
        style,
      ]}
      {...rest}
    />
  );
}

/** Atajo semántico para encabezados de sección. */
export function Heading(props: Omit<AppTextProps, 'variant'>) {
  return <AppText variant="heading" {...props} />;
}

const base: TextStyle = { color: colors.text.main };

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  title: {
    ...base,
    fontFamily: fonts.headingExtra,
    fontSize: fontSize.title,
    letterSpacing: 0.3,
  },
  heading: {
    ...base,
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    letterSpacing: 0.3,
  },
  subtitle: {
    ...base,
    fontFamily: fonts.headingSemi,
    fontSize: fontSize.lg,
  },
  body: {
    ...base,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
  },
  bodyMedium: {
    ...base,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
  },
  label: {
    color: colors.text.muted,
    fontFamily: fonts.bodySemi,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  caption: {
    color: colors.text.muted,
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  link: {
    color: colors.accent,
    fontFamily: fonts.bodySemi,
    fontSize: fontSize.md,
  },
});
