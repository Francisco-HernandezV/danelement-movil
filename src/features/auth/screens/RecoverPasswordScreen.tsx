import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Card, Input, Screen } from '@/components/ui';
import { spacing } from '@/theme';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { useRecoverPasswordViewModel } from '@/features/auth/viewmodels/useRecoverPasswordViewModel';

const SUBTITLES = {
  1: 'Te enviaremos un código para restablecerla.',
  2: 'Verifica el código que enviamos a tu correo.',
  3: 'Crea una nueva contraseña segura.',
} as const;

export function RecoverPasswordScreen() {
  const vm = useRecoverPasswordViewModel();

  return (
    <Screen scroll center>
      <AuthHeader title="Recuperar contraseña" subtitle={SUBTITLES[vm.step]} />

      <Card style={styles.card}>
        {vm.message ? <Banner variant={vm.messageType}>{vm.message}</Banner> : null}

        {vm.success ? (
          <Button title="Ir a iniciar sesión" onPress={() => router.replace('/sign-in')} />
        ) : vm.step === 1 ? (
          <>
            <Input
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={vm.email}
              onChangeText={vm.setEmail}
            />
            <Button title="Enviar código" loading={vm.loading} onPress={() => void vm.sendEmail()} />
          </>
        ) : vm.step === 2 ? (
          <>
            <AppText variant="caption" center style={styles.hint}>
              Hemos enviado un código a {vm.email}.
            </AppText>
            <Input
              label="Código de 6 dígitos"
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={vm.token}
              onChangeText={(t) => vm.setToken(t.replace(/\D/g, ''))}
            />
            <Button title="Verificar código" loading={vm.loading} onPress={() => void vm.validateToken()} />
            <Button title="Cambiar correo / reenviar" variant="secondary" onPress={vm.backToEmail} />
          </>
        ) : (
          <>
            <Input
              label="Nueva contraseña"
              placeholder="Nueva contraseña"
              secureToggle
              autoCapitalize="none"
              value={vm.nuevaPassword}
              onChangeText={vm.setNuevaPassword}
            />
            <Input
              label="Confirmar contraseña"
              placeholder="Repite la contraseña"
              secureToggle
              autoCapitalize="none"
              value={vm.confirmarPassword}
              onChangeText={vm.setConfirmarPassword}
            />
            <Button title="Actualizar contraseña" loading={vm.loading} onPress={() => void vm.resetPassword()} />
          </>
        )}

        <View style={styles.links}>
          <Link href="/sign-in">
            <AppText variant="link">Volver al inicio de sesión</AppText>
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  hint: { marginBottom: spacing.sm },
  links: { alignItems: 'center', marginTop: spacing.xl },
});
