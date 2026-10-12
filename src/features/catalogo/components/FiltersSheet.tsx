import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { CatalogoFiltros, OrdenCatalogo } from '@/features/catalogo/viewmodels/useCatalogoViewModel';
import { FILTROS_INICIALES } from '@/features/catalogo/viewmodels/useCatalogoViewModel';
import { AppText, Button, Input } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface FiltersSheetProps {
  visible: boolean;
  filtros: CatalogoFiltros;
  onApply: (next: CatalogoFiltros) => void;
  onClose: () => void;
}

const ORDENES: { value: OrdenCatalogo; label: string }[] = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio_asc', label: 'Precio ↑' },
  { value: 'precio_desc', label: 'Precio ↓' },
  { value: 'nombre', label: 'Nombre' },
];

export function FiltersSheet({ visible, filtros, onApply, onClose }: FiltersSheetProps) {
  const [draft, setDraft] = useState<CatalogoFiltros>(filtros);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      // Sincroniza el borrador con los filtros actuales al abrir (evento, no efecto).
      onShow={() => setDraft(filtros)}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <AppText variant="subtitle">Filtros</AppText>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.muted} />
          </Pressable>
        </View>

        <AppText variant="label" style={styles.section}>
          Rango de precio
        </AppText>
        <View style={styles.priceRow}>
          <Input
            containerStyle={styles.priceInput}
            placeholder="Mín."
            keyboardType="number-pad"
            value={draft.precioMin}
            onChangeText={(t) => setDraft((d) => ({ ...d, precioMin: t.replace(/\D/g, '') }))}
          />
          <AppText variant="caption">—</AppText>
          <Input
            containerStyle={styles.priceInput}
            placeholder="Máx."
            keyboardType="number-pad"
            value={draft.precioMax}
            onChangeText={(t) => setDraft((d) => ({ ...d, precioMax: t.replace(/\D/g, '') }))}
          />
        </View>

        <AppText variant="label" style={styles.section}>
          Ordenar por
        </AppText>
        <View style={styles.ordenRow}>
          {ORDENES.map((o) => {
            const active = draft.orden === o.value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setDraft((d) => ({ ...d, orden: o.value }))}
                style={[styles.ordenChip, active ? styles.ordenChipActive : styles.ordenChipInactive]}
              >
                <AppText variant="bodyMedium" color={active ? colors.text.main : colors.text.muted}>
                  {o.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text.muted} />
          <AppText variant="caption" style={styles.noteText}>
            Filtrar por talla y color estará disponible cuando el backend exponga esos datos de
            forma pública.
          </AppText>
        </View>

        <View style={styles.actions}>
          <Button
            title="Limpiar"
            variant="secondary"
            onPress={() => setDraft(FILTROS_INICIALES)}
            style={styles.actionBtn}
          />
          <Button
            title="Aplicar"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  section: { marginTop: spacing.md, marginBottom: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  priceInput: { flex: 1, marginBottom: 0 },
  ordenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ordenChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  ordenChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  ordenChipInactive: { backgroundColor: colors.bg.cardAlt, borderColor: colors.border },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteText: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1 },
});
