import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { montoCompacto, textoPrendas, type PuntoSerie } from '@/data/models/admin';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';

interface GraficaVentasProps {
  serie: PuntoSerie[];
  /** Índice de la barra tocada (o `null`). */
  seleccion: number | null;
  onSeleccionar: (i: number) => void;
  /** Serie agrupada por mes (cambia los textos). */
  porMes: boolean;
}

const ALTO = 150;

/**
 * Columnas de ventas por día (o por mes). Una sola serie en el azul de marca
 * (validado contra la superficie oscura): sin leyenda, el título la nombra.
 *
 * Especificación (skill dataviz): barras ≤ 24 px con punta redondeada de 4 px
 * y base recta, 2 px de separación, cuadrícula de 1 px discreta, etiquetas de
 * eje selectivas. Tocar una barra la resalta (las demás se atenúan) y muestra
 * su detalle arriba; el área táctil es toda la columna, no solo la barra.
 * "Ver tabla" ofrece los mismos datos en texto.
 */
export function GraficaVentas({ serie, seleccion, onSeleccionar, porMes }: GraficaVentasProps) {
  const [verTabla, setVerTabla] = useState(false);
  const max = Math.max(0, ...serie.map((p) => p.monto));
  const sel = seleccion !== null ? serie[seleccion] : null;
  const conVentas = serie.filter((p) => p.monto > 0);

  // Eje X: con ≤ 12 barras cada una lleva su etiqueta; con más no caben (cada
  // columna mide ~10 px), así que se muestran inicio, mitad y fin en una fila
  // propia, con día y mes ("28 sep").
  const etiquetasCompletas = serie.length <= 12;
  const corta = (p: PuntoSerie) => p.etiquetaLarga.replace(/ \d{4}$/, '');
  const medio = serie[Math.floor((serie.length - 1) / 2)];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="label">{porMes ? 'Ventas por mes' : 'Ventas por día'}</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => setVerTabla((v) => !v)}
          hitSlop={12}
        >
          <AppText variant="link" style={styles.toggle}>
            {verTabla ? 'Ver gráfica' : 'Ver tabla'}
          </AppText>
        </Pressable>
      </View>

      {verTabla ? (
        <View style={styles.tabla}>
          {conVentas.length === 0 ? (
            <AppText variant="caption">Sin ventas en el periodo.</AppText>
          ) : (
            conVentas.map((p) => (
              <View key={p.clave} style={styles.filaTabla}>
                <AppText variant="caption" style={styles.flex}>
                  {p.etiquetaLarga}
                </AppText>
                <AppText variant="caption" style={styles.prendas}>
                  {p.prendas} pzs
                </AppText>
                <AppText variant="bodyMedium" style={styles.monto}>
                  {formatPrecio(p.monto)}
                </AppText>
              </View>
            ))
          )}
        </View>
      ) : (
        <>
          {/* Lectura de la barra tocada (equivalente móvil del tooltip) */}
          <View style={styles.lectura}>
            {sel ? (
              <>
                <AppText variant="caption">{sel.etiquetaLarga}</AppText>
                <AppText variant="subtitle" style={styles.lecturaMonto}>
                  {formatPrecio(sel.monto)}
                </AppText>
                <AppText variant="caption">{textoPrendas(sel.prendas)}</AppText>
              </>
            ) : (
              <AppText variant="caption">
                {max > 0
                  ? `Toca una barra para ver el detalle · máximo ${formatPrecio(max)}`
                  : 'Sin ventas en el periodo.'}
              </AppText>
            )}
          </View>

          {/* Valor del tope de la escala, arriba de la gráfica (no encima de las barras) */}
          <AppText variant="caption" style={styles.ejeMax}>
            {montoCompacto(max)}
          </AppText>
          <View style={styles.plot}>
            {/* Cuadrícula: tope (máximo) y base */}
            <View style={[styles.grid, styles.tope]} />
            <View style={[styles.grid, styles.base]} />

            <View style={styles.columnas}>
              {serie.map((p, i) => {
                const alto = max > 0 && p.monto > 0 ? Math.max(2, (p.monto / max) * ALTO) : 0;
                const atenuada = seleccion !== null && seleccion !== i;
                return (
                  <Pressable
                    key={p.clave}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.etiquetaLarga}: ${formatPrecio(p.monto)}, ${textoPrendas(p.prendas)}`}
                    accessibilityState={{ selected: seleccion === i }}
                    onPress={() => onSeleccionar(i)}
                    style={styles.slot}
                  >
                    {alto > 0 ? (
                      <View
                        style={[
                          styles.barra,
                          { height: alto },
                          atenuada ? styles.atenuada : null,
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {etiquetasCompletas ? (
            <View style={styles.ejeX}>
              {serie.map((p) => (
                <View key={p.clave} style={styles.slotEtiqueta}>
                  <AppText variant="caption" style={styles.etiqueta}>
                    {p.etiqueta}
                  </AppText>
                </View>
              ))}
            </View>
          ) : serie.length > 0 ? (
            <View style={styles.ejeXTres}>
              <AppText variant="caption" style={styles.etiqueta}>
                {corta(serie[0])}
              </AppText>
              <AppText variant="caption" style={styles.etiqueta}>
                {corta(medio)}
              </AppText>
              <AppText variant="caption" style={styles.etiqueta}>
                {corta(serie[serie.length - 1])}
              </AppText>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { fontSize: 13 },
  flex: { flex: 1 },
  lectura: { minHeight: 52, justifyContent: 'center' },
  lecturaMonto: { fontFamily: fonts.headingSemi, color: colors.text.main },
  plot: { height: ALTO, justifyContent: 'flex-end' },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.border },
  tope: { top: 0 },
  base: { bottom: 0 },
  ejeMax: { fontSize: 11, marginBottom: -spacing.xs },
  columnas: { flexDirection: 'row', alignItems: 'flex-end', height: ALTO, gap: 2 },
  slot: { flex: 1, height: ALTO, justifyContent: 'flex-end', alignItems: 'center' },
  barra: {
    width: '100%',
    maxWidth: 24,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  atenuada: { opacity: 0.35 },
  ejeX: { flexDirection: 'row', gap: 2 },
  slotEtiqueta: { flex: 1, alignItems: 'center' },
  ejeXTres: { flexDirection: 'row', justifyContent: 'space-between' },
  etiqueta: { fontSize: 11 },
  tabla: { gap: spacing.xs },
  filaTabla: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prendas: { width: 56, textAlign: 'right' },
  monto: { width: 96, textAlign: 'right', color: colors.text.main },
});
