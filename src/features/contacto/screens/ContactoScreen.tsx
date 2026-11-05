import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Card, Heading, StateView } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import {
  useContactoViewModel,
  type MedioContacto,
} from '@/features/contacto/viewmodels/useContactoViewModel';

/**
 * Pestaña Contacto: teléfonos, WhatsApp, correo, ubicación y redes de la
 * tienda. Los datos salen de la Configuración de la web (panel de admin).
 */
export function ContactoScreen() {
  const insets = useSafeAreaInsets();
  const vm = useContactoViewModel();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Heading>Contacto</Heading>
        <AppText variant="caption">Escríbenos o llámanos, con gusto te atendemos.</AppText>
      </View>

      {vm.loading ? (
        <StateView kind="loading" title="Cargando contacto…" />
      ) : vm.error ? (
        <StateView
          kind="error"
          title="No se pudo cargar"
          message={vm.error}
          actionLabel="Reintentar"
          onAction={() => void vm.reintentar()}
        />
      ) : (
        <>
          {vm.avisoApertura ? <Banner variant="error">{vm.avisoApertura}</Banner> : null}

          {vm.contacto.length > 0 ? (
            <Card style={styles.lista}>
              {vm.contacto.map((medio, i) => (
                <FilaMedio
                  key={medio.key}
                  medio={medio}
                  ultimo={i === vm.contacto.length - 1}
                  onPress={() => void vm.abrir(medio.url)}
                />
              ))}
            </Card>
          ) : (
            <StateView
              kind="empty"
              title="Sin datos de contacto"
              message="La tienda aún no ha registrado sus medios de contacto."
            />
          )}

          {vm.redes.length > 0 ? (
            <>
              <AppText variant="label" style={styles.subtitulo}>
                Redes sociales
              </AppText>
              <View style={styles.redes}>
                {vm.redes.map((red) => (
                  <Pressable
                    key={red.key}
                    accessibilityRole="link"
                    accessibilityLabel={red.etiqueta}
                    onPress={() => void vm.abrir(red.url)}
                    style={({ pressed }) => [styles.red, pressed && styles.pressed]}
                  >
                    <Ionicons name={red.icono} size={22} color={colors.text.main} />
                    <AppText variant="bodyMedium">{red.etiqueta}</AppText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function FilaMedio({
  medio,
  ultimo,
  onPress,
}: {
  medio: MedioContacto;
  ultimo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${medio.etiqueta}: ${medio.valor}`}
      onPress={onPress}
      style={({ pressed }) => [styles.fila, !ultimo && styles.separador, pressed && styles.pressed]}
    >
      <View style={styles.icono}>
        <Ionicons name={medio.icono} size={22} color={colors.accent} />
      </View>
      <View style={styles.textos}>
        <AppText variant="caption">{medio.etiqueta}</AppText>
        <AppText variant="bodyMedium">{medio.valor}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.body },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs },
  lista: { paddingVertical: 0 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  separador: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: 2 },
  subtitulo: { marginTop: spacing.sm },
  redes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  red: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
});
