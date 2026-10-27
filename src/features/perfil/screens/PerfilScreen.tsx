import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, Card, Heading } from '@/components/ui';
import type { UserRole } from '@/data/models/user';
import { ROLES, roleLabel } from '@/data/models/user';
import { colors, radius, spacing } from '@/theme';
import { usePerfilViewModel } from '@/features/perfil/viewmodels/usePerfilViewModel';

export function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const vm = usePerfilViewModel();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const telefono = vm.telefono ?? (vm.loading ? '…' : 'No registrado');

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.backBar}>
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
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="person-circle" size={84} color={colors.accent} />
          <Heading center>{vm.nombre}</Heading>
          {vm.rol ? <RoleBadge rol={vm.rol} /> : null}
        </View>

        {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}

        <Card style={styles.card}>
          <AppText variant="label">Datos de la cuenta</AppText>
          <InfoRow icon="mail-outline" label="Correo" value={vm.email} />
          <InfoRow icon="call-outline" label="Teléfono" value={telefono} />
        </Card>

        {vm.rol === ROLES.vendedor || vm.rol === ROLES.admin ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir punto de venta"
              onPress={() => router.push('/ventas')}
              style={({ pressed }) => [styles.posBtn, pressed ? styles.posBtnPressed : null]}
            >
              <Ionicons name="cart" size={22} color={colors.accent} />
              <View style={styles.posTexts}>
                <AppText variant="bodyMedium" style={styles.posTitle}>
                  Punto de venta
                </AppText>
                <AppText variant="caption" style={styles.posSub}>
                  Buscar productos y clientes para vender
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir apartados"
              onPress={() => router.push('/apartados')}
              style={({ pressed }) => [styles.posBtn, pressed ? styles.posBtnPressed : null]}
            >
              <Ionicons name="bookmark" size={22} color={colors.accent} />
              <View style={styles.posTexts}>
                <AppText variant="bodyMedium" style={styles.posTitle}>
                  Apartados
                </AppText>
                <AppText variant="caption" style={styles.posSub}>
                  Nuevos apartados, abonos y liquidaciones
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </Pressable>
          </>
        ) : null}

        <Button title="Cerrar sesión" variant="danger" onPress={() => void vm.cerrarSesion()} />
      </ScrollView>
    </View>
  );
}

function RoleBadge({ rol }: { rol: UserRole }) {
  const palette = ROLE_PALETTE[rol];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <AppText variant="bodyMedium" color={palette.text} style={styles.badgeText}>
        {roleLabel(rol)}
      </AppText>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.text.muted} />
      <View style={styles.rowText}>
        <AppText variant="caption">{label}</AppText>
        <AppText variant="bodyMedium">{value || '—'}</AppText>
      </View>
    </View>
  );
}

const ROLE_PALETTE: Record<UserRole, { bg: string; border: string; text: string }> = {
  rol_admin: { bg: colors.redSoft, border: colors.redBorder, text: colors.red },
  rol_vendedor: { bg: colors.yellowSoft, border: colors.yellowBorder, text: colors.yellow },
  rol_gestor_inventario: { bg: colors.greenSoft, border: colors.greenBorder, text: colors.green },
  rol_cliente: { bg: colors.accentSoft, border: colors.accent, text: colors.accent },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.body },
  backBar: { paddingHorizontal: spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: { fontSize: 13 },
  card: { gap: spacing.lg, marginBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  posBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  posBtnPressed: { opacity: 0.7 },
  posTexts: { flex: 1, gap: 2 },
  posTitle: { color: colors.accent },
  posSub: { color: colors.text.main },
});
