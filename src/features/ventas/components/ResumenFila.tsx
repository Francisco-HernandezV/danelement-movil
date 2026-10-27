import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

interface ResumenFilaProps {
  etiqueta: string;
  valor: string;
  /** Resalta el valor (totales). */
  destacado?: boolean;
  /** Color del valor (p. ej. rojo para "restante", verde para "cambio"). */
  colorValor?: string;
}

/** Fila "etiqueta ........ valor" para resúmenes de venta y cobro. */
export function ResumenFila({ etiqueta, valor, destacado = false, colorValor }: ResumenFilaProps) {
  return (
    <View style={styles.fila}>
      <AppText variant={destacado ? 'bodyMedium' : 'caption'} style={styles.etiqueta}>
        {etiqueta}
      </AppText>
      <AppText
        variant={destacado ? 'subtitle' : 'bodyMedium'}
        numberOfLines={1}
        color={colorValor ?? (destacado ? colors.text.price : undefined)}
        style={styles.valor}
      >
        {valor}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  etiqueta: { flexShrink: 1 },
  valor: { flexShrink: 1, textAlign: 'right' },
});
