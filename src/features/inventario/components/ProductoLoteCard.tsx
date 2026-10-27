import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Input } from '@/components/ui';
import {
  indiceVariantes,
  ordenarTallas,
  totalPiezas,
  type ProductoLote,
  type SugerenciaPrecio,
} from '@/data/models/inventario';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, radius, spacing } from '@/theme';
import { MatrizTallaColor } from './MatrizTallaColor';

interface ProductoLoteCardProps {
  producto: ProductoLote;
  abierto: boolean;
  errores: string[];
  subtotal: number;
  sugerencia: SugerenciaPrecio | null | undefined;
  /** Clave de la celda seleccionada de ESTE producto (o `null`). */
  celdaSeleccionada: string | null;
  cantidadSeleccionada: number;
  onActivar: () => void;
  onQuitar: () => void;
  onCelda: (clave: string) => void;
  onCantidadTexto: (t: string) => void;
  onMas: () => void;
  onMenos: () => void;
  onCosto: (t: string) => void;
  onPrecio: (t: string) => void;
  onUsarSugerido: () => void;
}

/**
 * Un producto del lote. Cerrado: una línea con piezas y subtotal. Abierto:
 * matriz para capturar piezas (toca una celda y edítala abajo con − / +),
 * costo unitario, precio sugerido y precio de venta nuevo.
 */
export function ProductoLoteCard(props: ProductoLoteCardProps) {
  const { producto: p, abierto } = props;
  const tallas = useMemo(() => ordenarTallas(p.matriz.tallas), [p.matriz.tallas]);
  const indice = useMemo(() => indiceVariantes(p.matriz), [p.matriz]);
  const piezas = totalPiezas(p.celdas);

  const seleccion = props.celdaSeleccionada;
  const [tallaSel, colorSel] = seleccion ? seleccion.split('-').map(Number) : [null, null];
  const nombreCelda = seleccion
    ? `${p.matriz.colores.find((c) => c.id === colorSel)?.nombre ?? ''} · ${tallas.find((t) => t.id === tallaSel)?.valor ?? ''}`
    : '';
  const varianteSel = seleccion ? indice.get(seleccion) : undefined;

  return (
    <View style={abierto ? styles.cardAbierta : styles.card}>
      {/* Botones hermanos (no anidados): abrir/cerrar y quitar */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.matriz.producto.nombre}: ${piezas} piezas`}
          accessibilityState={{ expanded: abierto }}
          onPress={props.onActivar}
          style={styles.headerToggle}
        >
          <View style={styles.flex}>
            <AppText variant="bodyMedium" numberOfLines={1} style={styles.semi}>
              {p.matriz.producto.nombre}
            </AppText>
            <AppText variant="caption">
              {piezas} {piezas === 1 ? 'pieza' : 'piezas'}
              {props.subtotal > 0 ? ` · costo ${formatPrecio(props.subtotal)}` : ''}
            </AppText>
          </View>
          {props.errores.length === 0 ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
          ) : null}
          <Ionicons
            name={abierto ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text.muted}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${p.matriz.producto.nombre} del lote`}
          onPress={props.onQuitar}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Ionicons name="trash-outline" size={16} color={colors.text.muted} />
        </Pressable>
      </View>

      {abierto ? (
        <View style={styles.body}>
          <AppText variant="label">Piezas que entran (toca una celda)</AppText>
          <MatrizTallaColor
            tallas={tallas}
            colores={p.matriz.colores}
            indice={indice}
            celda={(_, clave) => {
              const n = p.celdas[clave] ?? 0;
              return {
                texto: n > 0 ? String(n) : '0',
                resaltada: n > 0,
                color: n > 0 ? colors.text.main : colors.text.muted,
              };
            }}
            onPressCelda={(clave) => props.onCelda(clave)}
            seleccion={seleccion}
          />

          {seleccion ? (
            <View style={styles.editor}>
              <View style={styles.flex}>
                <AppText variant="bodyMedium" numberOfLines={1} style={styles.semi}>
                  {nombreCelda}
                </AppText>
                <AppText variant="caption">
                  Stock actual {varianteSel?.stock ?? 0}
                  {varianteSel?.sku ? ` · ${varianteSel.sku}` : ''}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Una pieza menos"
                onPress={props.onMenos}
                hitSlop={6}
                style={styles.stepBtn}
              >
                <Ionicons name="remove" size={18} color={colors.text.main} />
              </Pressable>
              <Input
                value={props.cantidadSeleccionada > 0 ? String(props.cantidadSeleccionada) : ''}
                onChangeText={props.onCantidadTexto}
                placeholder="0"
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel={`Piezas de ${nombreCelda}`}
                containerStyle={styles.cantidad}
                style={styles.cantidadTexto}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Una pieza más"
                onPress={props.onMas}
                hitSlop={6}
                style={styles.stepBtn}
              >
                <Ionicons name="add" size={18} color={colors.text.main} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.precios}>
            <Input
              label="Costo unitario"
              value={p.costoTexto}
              onChangeText={props.onCosto}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftAccessory={<AppText variant="bodyMedium">$</AppText>}
              containerStyle={styles.precioInput}
            />
            <Input
              label="Precio de venta"
              value={p.precioTexto}
              onChangeText={props.onPrecio}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftAccessory={<AppText variant="bodyMedium">$</AppText>}
              containerStyle={styles.precioInput}
            />
          </View>

          <View style={styles.info}>
            <AppText variant="caption">
              Precio actual {formatPrecio(p.matriz.producto.precio_base)} · costo prom.{' '}
              {formatPrecio(p.matriz.producto.costo_promedio_actual)}
            </AppText>
            {props.sugerencia ? (
              <View style={styles.sugerencia}>
                <AppText variant="caption" style={styles.flex}>
                  Sugerido {formatPrecio(props.sugerencia.precio_sugerido)} (costo prom. nuevo{' '}
                  {formatPrecio(props.sugerencia.costo_promedio_nuevo)} ×{' '}
                  {props.sugerencia.margen_aplicado})
                </AppText>
                <AppText variant="link" style={styles.usar} onPress={props.onUsarSugerido}>
                  Usar
                </AppText>
              </View>
            ) : null}
            <AppText variant="caption" color={colors.yellow}>
              El precio de venta nuevo se aplica a todas las tallas y colores de este producto.
            </AppText>
          </View>

          {props.errores.length > 0 ? (
            <View style={styles.errores}>
              {props.errores.map((e) => (
                <View key={e} style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.red} />
                  <AppText variant="caption" color={colors.red}>
                    {e}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const cardBase = {
  backgroundColor: colors.bg.card,
  borderWidth: 1,
  borderRadius: radius.md,
} as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  semi: { fontFamily: fonts.bodySemi },
  card: { ...cardBase, borderColor: colors.border },
  cardAbierta: { ...cardBase, borderColor: colors.accent },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  headerToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  iconBtn: { padding: spacing.xs },
  body: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  editor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.cardAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidad: { width: 84, marginBottom: 0 },
  // `minWidth: 0` / `width`: en web el TextInput trae ancho mínimo propio y se desbordaba.
  cantidadTexto: { textAlign: 'center', minWidth: 0, width: '100%' },
  precios: { flexDirection: 'row', gap: spacing.sm },
  precioInput: { flex: 1, marginBottom: 0 },
  info: { gap: spacing.xs },
  sugerencia: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  usar: { fontSize: 13 },
  errores: { gap: spacing.xs },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
