import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import { AppText, Heading, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function TiendaRoute() {
  return (
    <Screen center>
      <View style={styles.wrap}>
        <Ionicons name="storefront-outline" size={48} color={colors.accent} />
        <Heading center>Tienda</Heading>
        <AppText variant="caption" center>
          Aquí irá la información de la tienda (ubicación, horarios y redes). Próximamente.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
});
