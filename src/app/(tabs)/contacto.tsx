import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import { AppText, Heading, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function ContactoRoute() {
  return (
    <Screen center>
      <View style={styles.wrap}>
        <Ionicons name="call-outline" size={48} color={colors.accent} />
        <Heading center>Contacto</Heading>
        <AppText variant="caption" center>
          Aquí irán los medios de contacto y atención al cliente. Próximamente.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
});
