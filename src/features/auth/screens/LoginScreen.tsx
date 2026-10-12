import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Card, Input, Screen } from '@/components/ui';
import { spacing } from '@/theme';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { useLoginViewModel } from '@/features/auth/viewmodels/useLoginViewModel';

export function LoginScreen() {
  const vm = useLoginViewModel();

  return (
    <Screen scroll center>
      <AuthHeader
        title={vm.requireChange ? 'Configura tu contraseña' : 'Iniciar sesión'}
        subtitle={
          vm.requireChange
            ? 'Define una contraseña definitiva para continuar.'
            : 'Bienvenido de nuevo. Ingresa tus credenciales.'
        }
      />

      <Card style={styles.card}>
        {vm.message ? <Banner variant={vm.messageType}>{vm.message}</Banner> : null}

        {vm.requireChange ? (
          <>
            <Input
              label="Nueva contraseña"
              placeholder="Nueva contraseña definitiva"
              secureToggle
              value={vm.newPassword}
              onChangeText={vm.setNewPassword}
            />
            <Input
              label="Confirmar contraseña"
              placeholder="Repite la contraseña"
              secureToggle
              value={vm.confirmPassword}
              onChangeText={vm.setConfirmPassword}
            />
            <Button
              title="Actualizar y entrar"
              loading={vm.loading}
              onPress={() => void vm.submitNewPassword()}
            />
          </>
        ) : (
          <>
            <Input
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={vm.email}
              error={vm.fieldErrors.email}
              onChangeText={(t) => {
                vm.setEmail(t);
                vm.clearFieldError('email');
              }}
            />
            <Input
              label="Contraseña"
              placeholder="Tu contraseña"
              secureToggle
              autoCapitalize="none"
              value={vm.password}
              error={vm.fieldErrors.password}
              onChangeText={(t) => {
                vm.setPassword(t);
                vm.clearFieldError('password');
              }}
            />
            <Button title="Entrar" loading={vm.loading} onPress={() => void vm.submit()} />

            <View style={styles.links}>
              <Link href="/register">
                <AppText variant="link">Crear cuenta</AppText>
              </Link>
              <AppText variant="caption">·</AppText>
              <Link href="/recover">
                <AppText variant="link">¿Olvidaste tu contraseña?</AppText>
              </Link>
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
