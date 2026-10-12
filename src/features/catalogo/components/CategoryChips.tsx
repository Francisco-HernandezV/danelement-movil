import { Pressable, ScrollView, StyleSheet } from 'react-native';

import type { Categoria } from '@/data/models/producto';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface CategoryChipsProps {
  categorias: Categoria[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

/** Chips horizontales de categoría; la seleccionada se resalta en azul. */
export function CategoryChips({ categorias, selectedId, onSelect }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Chip label="Todo" active={selectedId === null} onPress={() => onSelect(null)} />
      {categorias.map((c) => (
        <Chip
          key={c.id}
          label={c.nombre}
          active={selectedId === c.id}
          onPress={() => onSelect(c.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <AppText
        variant="bodyMedium"
        color={active ? colors.text.main : colors.text.muted}
        style={styles.chipText}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // flexGrow:0 evita que el ScrollView horizontal crezca y estire los chips
  // verticalmente cuando hay espacio libre debajo (pocos productos).
  scroll: { flexGrow: 0, flexShrink: 0 },
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  chip: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipInactive: { backgroundColor: colors.bg.card, borderColor: colors.border },
  chipText: { fontSize: 13 },
});
