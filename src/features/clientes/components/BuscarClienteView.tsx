import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Input, StateView } from '@/components/ui';
import type { ClienteBusqueda } from '@/data/models/cliente';
import { colors, fonts, radius, spacing } from '@/theme';
import { ClienteResultRow } from './ClienteResultRow';
import { useBuscarClienteViewModel } from '@/features/clientes/viewmodels/useBuscarClienteViewModel';

interface BuscarClienteViewProps {
  /** Se dispara al tocar un cliente. */
  onSelect: (cliente: ClienteBusqueda) => void;
  /**
   * Si el backend permite venta sin cliente (venta de mostrador), mostramos
   * una opción visible para continuar sin cliente. `/api/ventas/procesar`
   * acepta `cliente_id: null`, así que por defecto está habilitada.
   */
  onContinuarSinCliente?: () => void;
}

/** Vista reutilizable de búsqueda de clientes para el POS. */
export function BuscarClienteView({ onSelect, onContinuarSinCliente }: BuscarClienteViewProps) {
  const vm = useBuscarClienteViewModel();

  const empty = !vm.loading && !vm.error && vm.resultados.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Input
        containerStyle={styles.input}
        placeholder="Buscar por nombre, teléfono o email"
        value={vm.query}
        onChangeText={vm.setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="default"
        returnKeyType="search"
        leftAccessory={<Ionicons name="search" size={18} color={colors.text.muted} />}
      />

      {onContinuarSinCliente ? (
        <Pressable
          accessibilityRole="button"
          onPress={onContinuarSinCliente}
          style={({ pressed }) => [
            styles.sinCliente,
            pressed ? styles.sinClientePressed : null,
          ]}
        >
          <Ionicons name="person-outline" size={18} color={colors.accent} />
          <AppText variant="bodyMedium" style={styles.sinClienteText}>
            Continuar sin cliente (venta de mostrador)
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </Pressable>
      ) : null}

      {vm.idle ? (
        <StateView
          kind="empty"
          title="Busca un cliente"
          message="Escribe al menos 2 caracteres del nombre, teléfono o email."
        />
      ) : vm.loading && vm.resultados.length === 0 ? (
        <StateView kind="loading" title="Buscando..." />
      ) : vm.error ? (
        <StateView
          kind="error"
          title="No se pudo buscar"
          message={vm.error}
          actionLabel="Reintentar"
          onAction={vm.reintentar}
        />
      ) : empty ? (
        <StateView
          kind="empty"
          title="Sin resultados"
          message="No hay clientes que coincidan."
        />
      ) : (
        <FlatList
          data={vm.resultados}
          keyExtractor={(c) => String(c.id)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ItemGap}
          renderItem={({ item }) => <ClienteResultRow cliente={item} onPress={onSelect} />}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function ItemGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.sm },
  input: { marginBottom: 0 },
  listContent: { paddingVertical: spacing.sm, paddingBottom: spacing.xxl },
  gap: { height: spacing.sm },
  sinCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sinClientePressed: { opacity: 0.7 },
  sinClienteText: { flex: 1, color: colors.accent, fontFamily: fonts.bodySemi },
});
