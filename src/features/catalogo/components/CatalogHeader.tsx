import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { AppText } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';

/** Encabezado del catálogo: marca + acceso a Iniciar sesión / Perfil. */
export function CatalogHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <View style={styles.row}>
      <View>
        <AppText style={styles.brandLogo}>DAN ELEMENT</AppText>
        <AppText style={styles.brandSub}>BOUTIQUE</AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isAuthenticated ? 'Ir a mi perfil' : 'Iniciar sesión'}
        hitSlop={8}
        onPress={() => router.push(isAuthenticated ? '/perfil' : '/sign-in')}
        style={styles.account}
      >
        <Ionicons
          name={isAuthenticated ? 'person-circle' : 'person-circle-outline'}
          size={30}
          color={isAuthenticated ? colors.accent : colors.text.main}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  brandLogo: {
    fontFamily: fonts.headingExtra,
    fontSize: 20,
    letterSpacing: 2,
    color: colors.text.main,
  },
  brandSub: {
    fontFamily: fonts.headingSemi,
    fontSize: 10,
    letterSpacing: 4,
    color: colors.accent,
  },
  account: { padding: spacing.xs },
});
