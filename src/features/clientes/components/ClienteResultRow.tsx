import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { contactoCliente, nombreCliente, type ClienteBusqueda } from '@/data/models/cliente';
import { colors, fonts, radius, spacing } from '@/theme';

interface ClienteResultRowProps {
  cliente: ClienteBusqueda;
  onPress: (cliente: ClienteBusqueda) => void;
}

/** Fila de resultado de búsqueda de cliente. */
export const ClienteResultRow = memo(function ClienteResultRow({
  cliente,
  onPress,
}: ClienteResultRowProps) {
  const contacto = contactoCliente(cliente);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar cliente ${nombreCliente(cliente)}`}
      onPress={() => onPress(cliente)}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={22} color={colors.text.muted} />
      </View>

      <View style={styles.info}>
        <AppText variant="body" numberOfLines={1} style={styles.nombre}>
          {nombreCliente(cliente)}
        </AppText>
        {contacto ? (
          <AppText variant="caption" numberOfLines={1} style={styles.contacto}>
            {contacto}
          </AppText>
        ) : null}
        {cliente.rfc ? (
          <AppText variant="caption" numberOfLines={1} style={styles.rfc}>
            RFC {cliente.rfc}
          </AppText>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
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
  rowPressed: { backgroundColor: colors.bg.cardAlt },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  nombre: { fontFamily: fonts.headingSemi },
  contacto: { color: colors.text.main },
  rfc: { color: colors.text.muted },
});
