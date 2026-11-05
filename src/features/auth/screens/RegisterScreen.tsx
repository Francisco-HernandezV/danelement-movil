import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Card, Input, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { useRegisterViewModel } from '@/features/auth/viewmodels/useRegisterViewModel';

export function RegisterScreen() {
  const vm = useRegisterViewModel();

  return (
    <Screen scroll center>
      <AuthHeader title="Crear cuenta" subtitle="Crea tu cuenta para guardar tus datos de contacto con la tienda." />

      <Card style={styles.card}>
        {vm.message ? (
          <Banner variant={vm.success ? 'success' : 'error'}>{vm.message}</Banner>
        ) : null}

        {vm.success ? (
          <Button title="Volver a iniciar sesión" onPress={() => router.replace('/sign-in')} />
        ) : (
          <>
            <Input
              label="Nombre completo"
              placeholder="Nombre y apellidos"
              autoCapitalize="words"
              value={vm.nombre}
              error={vm.fieldErrors.nombre}
              onChangeText={(t) => {
                vm.setNombre(t);
                vm.clearFieldError('nombre');
              }}
            />
            <Input
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={vm.email}
              error={vm.fieldErrors.email}
              onChangeText={(t) => {
                vm.setEmail(t);
                vm.clearFieldError('email');
              }}
            />
            <Input
              label="Teléfono (opcional)"
              placeholder="10 dígitos"
              keyboardType="phone-pad"
              maxLength={10}
              value={vm.telefono}
              error={vm.fieldErrors.telefono_contacto}
              onChangeText={(t) => {
                vm.setTelefono(t.replace(/\D/g, ''));
                vm.clearFieldError('telefono_contacto');
              }}
            />
            <Input
              label="Fecha de nacimiento"
              placeholder="AAAA-MM-DD"
              keyboardType="number-pad"
              maxLength={10}
              value={vm.fechaNacimiento}
              error={vm.fieldErrors.fecha_nacimiento}
              onChangeText={(t) => {
                vm.setFecha(t);
                vm.clearFieldError('fecha_nacimiento');
              }}
            />
            <Input
              label="Contraseña"
              placeholder="8-16 caracteres, con mayúscula, número y símbolo"
              secureToggle
              autoCapitalize="none"
              value={vm.password}
              error={vm.fieldErrors.password}
              onChangeText={(t) => {
                vm.setPassword(t);
                vm.clearFieldError('password');
              }}
            />
            {/* Aceptación obligatoria de Términos y Aviso de privacidad */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: vm.aceptaTerminos }}
              onPress={() => {
                vm.setAceptaTerminos(!vm.aceptaTerminos);
                vm.clearFieldError('acepta_terminos');
              }}
              style={styles.checkRow}
              hitSlop={6}
            >
              <Ionicons
                name={vm.aceptaTerminos ? 'checkbox' : 'square-outline'}
                size={22}
                color={vm.fieldErrors.acepta_terminos ? colors.red : colors.accent}
              />
              <AppText variant="caption" style={styles.checkText}>
                Acepto los{' '}
                <AppText
                  variant="link"
                  onPress={() => router.push('/legal/terminos')}
                >
                  Términos y condiciones
                </AppText>{' '}
                y el{' '}
                <AppText
                  variant="link"
                  onPress={() => router.push('/legal/privacidad')}
                >
                  Aviso de privacidad
                </AppText>
                .
              </AppText>
            </Pressable>
            {vm.fieldErrors.acepta_terminos ? (
              <AppText variant="caption" color={colors.red}>
                {vm.fieldErrors.acepta_terminos}
              </AppText>
            ) : null}

            <Button title="Registrarse" loading={vm.loading} onPress={() => void vm.submit()} />

            <View style={styles.links}>
              <AppText variant="caption">¿Ya tienes cuenta?</AppText>
              <Link href="/sign-in">
                <AppText variant="link">Inicia sesión</AppText>
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  checkText: { flex: 1, lineHeight: 20 },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
