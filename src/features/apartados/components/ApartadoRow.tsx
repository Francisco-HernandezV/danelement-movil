import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  estadoVisible,
  formatFechaLimite,
  porcentajeAbonado,
  textoVigencia,
  type ApartadoResumen,
} from '@/data/models/apartado';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { EstadoApartadoBadge } from './EstadoApartadoBadge';
import { ProgresoAbono } from './ProgresoAbono';

interface ApartadoRowProps {
  apartado: ApartadoResumen;
  onPress: (id: number) => void;
}

/** Tarjeta de la lista: folio, cliente, saldo, progreso y vigencia. */
export const ApartadoRow = memo(function ApartadoRow({ apartado: a, onPress }: ApartadoRowProps) {
  const estado = estadoVisible(a);
  const activo = estado === 'activo' || estado === 'vencido';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Apartado ${a.id} de ${a.cliente_nombre ?? 'cliente'}`}
      onPress={() => onPress(a.id)}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.top}>
        <AppText variant="caption" style={styles.folio}>
          #{a.id}
        </AppText>
        <EstadoApartadoBadge estado={estado} />
        <View style={styles.flex} />
        <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
      </View>

      <View style={styles.mid}>
        <View style={styles.flex}>
          <AppText variant="bodyMedium" numberOfLines={1} style={styles.cliente}>
            {a.cliente_nombre?.trim() || 'Cliente sin nombre'}
          </AppText>
          {a.cliente_tel ? (
            <AppText variant="caption" numberOfLines={1}>
              {a.cliente_tel}
            </AppText>
          ) : null}
        </View>
        <View style={styles.montos}>
          <AppText variant="caption">{activo ? 'Saldo' : 'Total'}</AppText>
          <AppText variant="subtitle" color={activo ? colors.text.price : colors.text.main}>
            {formatPrecio(activo ? a.saldo : a.total)}
          </AppText>
        </View>
      </View>

      {activo ? (
        <>
          <ProgresoAbono porcentaje={porcentajeAbonado(a)} />
          <View style={styles.bottom}>
            <AppText variant="caption">
              Abonado {formatPrecio(a.abonado)} de {formatPrecio(a.total)}
            </AppText>
            <AppText
              variant="caption"
              color={estado === 'vencido' ? colors.red : a.dias_restantes <= 2 ? colors.yellow : undefined}
            >
              {textoVigencia(a.dias_restantes)} · {formatFechaLimite(a.fecha_limite)}
            </AppText>
          </View>
        </>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.bg.cardAlt },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  folio: { fontFamily: fonts.bodySemi, color: colors.text.muted },
  flex: { flex: 1 },
  mid: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cliente: { fontFamily: fonts.bodySemi },
  montos: { alignItems: 'flex-end' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
});
