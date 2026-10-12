import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onOpenFilters: () => void;
  /** Resalta el botón de filtros cuando hay filtros aplicados. */
  filtersActive?: boolean;
}

/** Barra de búsqueda (lupa) + botón de filtros. */
export function SearchBar({ value, onChangeText, onOpenFilters, filtersActive }: SearchBarProps) {
  return (
    <View style={styles.row}>
      <Input
        containerStyle={styles.inputContainer}
        placeholder="Buscar por nombre o palabra clave"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        returnKeyType="search"
        leftAccessory={<Ionicons name="search" size={18} color={colors.text.muted} />}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros"
        onPress={onOpenFilters}
        style={[styles.filterBtn, filtersActive && styles.filterBtnActive]}
      >
        <Ionicons
          name="options-outline"
          size={22}
          color={filtersActive ? colors.text.main : colors.text.main}
        />
        {filtersActive ? <View style={styles.dot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputContainer: { flex: 1, marginBottom: 0 },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { borderColor: colors.accent },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
