import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import {
  claveCelda,
  type ColorMatriz,
  type TallaMatriz,
  type VarianteMatriz,
} from '@/data/models/inventario';
import { colors, fonts, radius, spacing } from '@/theme';

/** Cómo pintar una celda que sí tiene variante. */
export interface CeldaVista {
  texto: string;
  /** Color del texto (tokens de texto o de estado). */
  color?: string;
  /** Fondo resaltado (p. ej. celda con piezas capturadas). */
  resaltada?: boolean;
}

interface MatrizTallaColorProps {
  tallas: TallaMatriz[];
  colores: ColorMatriz[];
  /** Celda → variante; las combinaciones sin variante se muestran con "—". */
  indice: Map<string, VarianteMatriz>;
  celda: (v: VarianteMatriz, clave: string) => CeldaVista;
  /** Total por fila de color (opcional). */
  totalFila?: (colorId: number) => string;
  /** Total por columna de talla (opcional). */
  totalColumna?: (tallaId: number) => string;
  /** Si se pasa, las celdas con variante se pueden tocar (captura). */
  onPressCelda?: (clave: string, v: VarianteMatriz) => void;
  /** Celda seleccionada (se marca con el acento). */
  seleccion?: string | null;
}

const ANCHO_COLOR = 104;
const ANCHO_CELDA = 56;
const ALTO_CELDA = 44;

/**
 * Matriz talla × color. La columna de colores queda fija a la izquierda y las
 * tallas se desplazan en horizontal, para que funcione con muchas tallas en
 * pantalla de teléfono. Solo las combinaciones que existen como variante se
 * pueden tocar; el resto se marca con "—".
 */
export function MatrizTallaColor({
  tallas,
  colores,
  indice,
  celda,
  totalFila,
  totalColumna,
  onPressCelda,
  seleccion = null,
}: MatrizTallaColorProps) {
  return (
    <View style={styles.wrap}>
      {/* Columna fija: colores */}
      <View style={styles.colFija}>
        <View style={[styles.cabecera, { width: ANCHO_COLOR }]}>
          <AppText variant="caption">Color / Talla</AppText>
        </View>
        {colores.map((c) => (
          <View key={c.id} style={styles.filaColor}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: c.codigo_hex || colors.bg.cardAlt },
              ]}
            />
            <AppText variant="caption" numberOfLines={2} style={styles.nombreColor}>
              {c.nombre}
            </AppText>
          </View>
        ))}
        {totalColumna ? (
          <View style={[styles.filaColor, styles.filaTotal]}>
            <AppText variant="caption" style={styles.semi}>
              Total
            </AppText>
          </View>
        ) : null}
      </View>

      {/* Tallas: desplazamiento horizontal */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View>
          <View style={styles.fila}>
            {tallas.map((t) => (
              <View key={t.id} style={styles.cabecera}>
                <AppText variant="bodyMedium" style={styles.semi}>
                  {t.valor}
                </AppText>
              </View>
            ))}
            {totalFila ? (
              <View style={styles.cabecera}>
                <AppText variant="caption" style={styles.semi}>
                  Total
                </AppText>
              </View>
            ) : null}
          </View>

          {colores.map((c) => (
            <View key={c.id} style={styles.fila}>
              {tallas.map((t) => {
                const clave = claveCelda(t.id, c.id);
                const v = indice.get(clave);
                if (!v) {
                  return (
                    <View
                      key={clave}
                      style={styles.celdaVacia}
                      accessible
                      accessibilityLabel={`${c.nombre} talla ${t.valor}: no existe esta variante`}
                    >
                      <AppText variant="caption">—</AppText>
                    </View>
                  );
                }
                const vista = celda(v, clave);
                const elegida = seleccion === clave;
                const estilo = elegida
                  ? styles.celdaElegida
                  : vista.resaltada
                    ? styles.celdaResaltada
                    : styles.celda;
                const contenido = (
                  <AppText variant="bodyMedium" color={vista.color} style={styles.semi}>
                    {vista.texto}
                  </AppText>
                );
                return onPressCelda ? (
                  <Pressable
                    key={clave}
                    accessibilityRole="button"
                    accessibilityLabel={`${c.nombre} talla ${t.valor}: ${vista.texto}`}
                    accessibilityState={{ selected: elegida }}
                    onPress={() => onPressCelda(clave, v)}
                    style={estilo}
                  >
                    {contenido}
                  </Pressable>
                ) : (
                  <View
                    key={clave}
                    style={estilo}
                    accessible
                    accessibilityLabel={`${c.nombre} talla ${t.valor}: ${vista.texto}`}
                  >
                    {contenido}
                  </View>
                );
              })}
              {totalFila ? (
                <View style={styles.celdaTotal}>
                  <AppText variant="bodyMedium" style={styles.semi}>
                    {totalFila(c.id)}
                  </AppText>
                </View>
              ) : null}
            </View>
          ))}

          {totalColumna ? (
            <View style={styles.fila}>
              {tallas.map((t) => (
                <View key={t.id} style={styles.celdaTotal}>
                  <AppText variant="bodyMedium" style={styles.semi}>
                    {totalColumna(t.id)}
                  </AppText>
                </View>
              ))}
              {totalFila ? <View style={styles.celdaTotal} /> : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const celdaBase = {
  width: ANCHO_CELDA - 4,
  height: ALTO_CELDA - 4,
  margin: 2,
  borderRadius: radius.sm,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row' },
  semi: { fontFamily: fonts.bodySemi },
  colFija: { width: ANCHO_COLOR },
  scroll: { flex: 1 },
  fila: { flexDirection: 'row' },
  cabecera: {
    width: ANCHO_CELDA,
    height: ALTO_CELDA - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaColor: {
    height: ALTO_CELDA,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  filaTotal: { borderTopWidth: 1, borderTopColor: colors.border },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nombreColor: { flex: 1, color: colors.text.main },
  celda: { ...celdaBase, borderColor: colors.border, backgroundColor: colors.bg.cardAlt },
  celdaResaltada: { ...celdaBase, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  celdaElegida: { ...celdaBase, borderColor: colors.accent, borderWidth: 2, backgroundColor: colors.accentSoft },
  celdaVacia: { ...celdaBase, borderColor: 'transparent', backgroundColor: colors.bg.body },
  celdaTotal: {
    width: ANCHO_CELDA,
    height: ALTO_CELDA,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
