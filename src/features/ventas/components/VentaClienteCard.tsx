import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { contactoCliente, nombreCliente, type ClienteBusqueda } from '@/data/models/cliente';
import { colors, fonts, radius, spacing } from '@/theme';

interface VentaClienteCardProps {
  cliente: ClienteBusqueda | null;
  sinCliente: boolean;
  onBuscar: () => void;
  onQuitar: () => void;
}

/** Tarjeta superior del POS que muestra/elige el cliente de la venta. */
export function VentaClienteCard({
  cliente,
  sinCliente,
  onBuscar,
  onQuitar,
}: VentaClienteCardProps) {
  if (cliente) {
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={colors.accent} />
        </View>
        <View style={styles.info}>
          <AppText variant="caption" style={styles.caption}>
            Cliente
          </AppText>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {nombreCliente(cliente)}
          </AppText>
          {contactoCliente(cliente) ? (
            <AppText variant="caption" numberOfLines={1} style={styles.caption}>
              {contactoCliente(cliente)}
            </AppText>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar cliente"
            onPress={onBuscar}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="swap-horizontal" size={18} color={colors.text.main} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar cliente"
            onPress={onQuitar}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="close" size={18} color={colors.text.main} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (sinCliente) {
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="storefront" size={22} color={colors.accent} />
        </View>
        <View style={styles.info}>
          <AppText variant="caption" style={styles.caption}>
            Modo
          </AppText>
          <AppText variant="bodyMedium">Venta de mostrador</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar cliente"
          onPress={onBuscar}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Ionicons name="person-add" size={18} color={colors.text.main} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Buscar cliente"
      onPress={onBuscar}
      style={({ pressed }) => [styles.card, styles.cardEmpty, pressed ? styles.pressed : null]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person-add-outline" size={22} color={colors.accent} />
      </View>
      <View style={styles.info}>
        <AppText variant="bodyMedium" style={styles.emptyTitle}>
          Seleccionar cliente
        </AppText>
        <AppText variant="caption" style={styles.caption}>
          O continuar como venta de mostrador
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cardEmpty: { borderStyle: 'dashed' },
  pressed: { backgroundColor: colors.bg.cardAlt },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  caption: { color: colors.text.muted },
  emptyTitle: { fontFamily: fonts.bodySemi },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
