import { StyleSheet, View } from 'react-native';

import { AppText, Heading } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

/** Marca "DAN ELEMENT / BOUTIQUE" + título de la pantalla de auth. */
export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.brand}>
        <AppText style={styles.brandLogo}>DAN ELEMENT</AppText>
        <AppText style={styles.brandSub}>BOUTIQUE</AppText>
      </View>
      <Heading center>{title}</Heading>
      {subtitle ? (
        <AppText variant="caption" center style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: spacing.xl },
  brand: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  brandLogo: {
    fontFamily: fonts.headingExtra,
    fontSize: 20,
    letterSpacing: 2.5,
    color: colors.text.main,
  },
  brandSub: {
    fontFamily: fonts.headingSemi,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.accent,
  },
  subtitle: { marginTop: spacing.sm, paddingHorizontal: spacing.md },
});
