import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Card, Heading, Input, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useEliminarCuentaViewModel } from '@/features/perfil/viewmodels/useEliminarCuentaViewModel';

const PASOS: { icono: React.ComponentProps<typeof Ionicons>['name']; texto: string }[] = [
  { icono: 'lock-closed-outline', texto: 'Tu cuenta se desactiva de inmediato y se cierran tus sesiones.' },
  { icono: 'time-outline', texto: 'Tienes 30 días para arrepentirte: inicia sesión y la eliminación se cancela.' },
  { icono: 'trash-outline', texto: 'A los 30 días se borran tu nombre, correo, teléfono y fecha de nacimiento.' },
  { icono: 'receipt-outline', texto: 'Tus compras y apartados se conservan sin datos que te identifiquen.' },
];

/** Confirmación para que un cliente elimine su cuenta. */
export function EliminarCuentaScreen() {
  const vm = useEliminarCuentaViewModel();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  return (
    <Screen scroll>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        onPress={goBack}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.main} />
        <AppText variant="bodyMedium">Volver</AppText>
      </Pressable>

      <View style={styles.header}>
        <Ionicons name="warning-outline" size={48} color={colors.red} />
        <Heading center>Eliminar mi cuenta</Heading>
      </View>

      <Card style={styles.card}>
        {PASOS.map((p) => (
          <View key={p.texto} style={styles.paso}>
            <Ionicons name={p.icono} size={20} color={colors.accent} />
            <AppText variant="caption" style={styles.pasoTexto}>
              {p.texto}
            </AppText>
          </View>
        ))}
        <AppText variant="caption" color={colors.yellow}>
          Si tienes un apartado activo, primero debes liquidarlo o cancelarlo en la tienda.
        </AppText>
      </Card>

      {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}

      <Input
        label="Contraseña"
        placeholder="Escribe tu contraseña para confirmar"
        secureToggle
        autoCapitalize="none"
        value={vm.password}
        onChangeText={vm.setPassword}
      />

      <Button
        title="Sí, eliminar mi cuenta"
        variant="danger"
        loading={vm.loading}
        onPress={() => void vm.eliminar()}
      />
      <Button title="Cancelar" variant="secondary" onPress={goBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  header: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  card: { gap: spacing.md, marginBottom: spacing.md },
  paso: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pasoTexto: { flex: 1, lineHeight: 20 },
});
