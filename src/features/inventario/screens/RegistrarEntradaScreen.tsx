import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Banner, Button, ConfirmSheet, Input } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { ResumenFila } from '@/features/ventas/components/ResumenFila';
import { AgregarProductoSheet } from '@/features/inventario/components/AgregarProductoSheet';
import { ProductoLoteCard } from '@/features/inventario/components/ProductoLoteCard';
import { useRegistrarEntradaViewModel } from '@/features/inventario/viewmodels/useRegistrarEntradaViewModel';

/**
 * Registrar entrada de mercancía: origen y productos (piezas por talla×color,
 * costo y precio) → resumen → registro. La lógica vive en
 * `useRegistrarEntradaViewModel`.
 */
export function RegistrarEntradaScreen() {
  const insets = useSafeAreaInsets();
  const vm = useRegistrarEntradaViewModel();
  const { retroceder } = vm;

  // Android: atrás primero regresa del resumen a la captura.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', retroceder);
      return () => sub.remove();
    }, [retroceder]),
  );

  const enResumen = vm.modo === 'resumen' && !vm.registrada;
  const titulo = vm.registrada ? 'Entrada registrada' : enResumen ? 'Revisar entrada' : 'Registrar entrada';

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={enResumen ? 'Volver a la captura' : 'Volver'}
          onPress={enResumen ? vm.volverACaptura : vm.salir}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" style={styles.title}>
          {titulo}
        </AppText>
      </View>

      {vm.registrada ? (
        <View style={styles.flex}>
          <ScrollView contentContainerStyle={styles.okScroll}>
            <View style={styles.okIcon}>
              <Ionicons name="checkmark" size={40} color={colors.green} />
            </View>
            <AppText variant="subtitle" center>
              ¡Entrada registrada!
            </AppText>
            <AppText variant="caption" center>
              Folio #{vm.registrada.entrada_id}
            </AppText>
            <View style={styles.card}>
              <ResumenFila etiqueta="Productos" valor={String(vm.registrada.productos)} />
              <ResumenFila etiqueta="Piezas" valor={String(vm.registrada.piezas)} />
              <ResumenFila etiqueta="Total del lote" valor={formatPrecio(vm.registrada.total_lote)} destacado />
            </View>
            <AppText variant="caption" center>
              El stock, el costo promedio y el precio de venta ya se actualizaron.
            </AppText>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <Button title="Ver historial de entradas" onPress={vm.verHistorial} />
            <Button title="Registrar otra entrada" variant="secondary" onPress={vm.nuevaEntrada} />
          </View>
        </View>
      ) : enResumen ? (
        <View style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll}>
            {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}
            <View style={styles.card}>
              <ResumenFila etiqueta="Origen" valor={vm.origen.trim() || 'Sin origen'} />
              <ResumenFila etiqueta="Referencia" valor={vm.nota.trim() || 'Sin referencia'} />
            </View>
            {vm.resumen.productos.map((p) => (
              <View key={p.id} style={styles.card}>
                <AppText variant="bodyMedium" numberOfLines={1} style={styles.semi}>
                  {p.nombre}
                </AppText>
                <ResumenFila etiqueta={`${p.piezas} piezas × ${formatPrecio(p.costo)}`} valor={formatPrecio(p.subtotal)} />
                <ResumenFila
                  etiqueta="Precio de venta"
                  valor={
                    p.precioNuevo === p.precioActual
                      ? `${formatPrecio(p.precioNuevo)} (sin cambio)`
                      : `${formatPrecio(p.precioActual)} → ${formatPrecio(p.precioNuevo)}`
                  }
                />
              </View>
            ))}
            {vm.resumen.productos.some((p) => p.precioNuevo !== p.precioActual) ? (
              <Banner variant="info">
                Los precios nuevos se aplican a todas las tallas y colores de cada producto, también a
                las que no entran en este lote.
              </Banner>
            ) : null}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.totales}>
              <ResumenFila etiqueta="Piezas" valor={String(vm.resumen.piezas)} />
              <ResumenFila etiqueta="Total del lote" valor={formatPrecio(vm.resumen.total)} destacado />
            </View>
            <Button title="Registrar entrada" onPress={vm.registrar} loading={vm.enviando} disabled={!vm.resumen.listo} />
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Input
                label="Origen de la mercancía"
                value={vm.origen}
                onChangeText={vm.setOrigen}
                placeholder="Ej. Bazar CDMX, Proveedor X…"
                maxLength={150}
                containerStyle={styles.input}
              />
              <Input
                label="Nota o folio de referencia (opcional)"
                value={vm.nota}
                onChangeText={vm.setNota}
                placeholder="Ej. Factura #1234, remisión…"
                maxLength={150}
                containerStyle={styles.input}
              />
            </View>

            <AppText variant="label">Productos · {vm.lote.length}</AppText>
            {vm.lote.map((p) => {
              const id = p.matriz.producto.id;
              const r = vm.resumen.productos.find((x) => x.id === id);
              const seleccion = vm.celdaActiva?.productoId === id ? vm.celdaActiva.clave : null;
              return (
                <ProductoLoteCard
                  key={id}
                  producto={p}
                  abierto={vm.productoActivoId === id}
                  errores={r?.errores ?? []}
                  subtotal={r?.subtotal ?? 0}
                  sugerencia={vm.sugerencias[id]}
                  celdaSeleccionada={seleccion}
                  cantidadSeleccionada={seleccion ? vm.cantidadActiva : 0}
                  onActivar={() => vm.activarProducto(id)}
                  onQuitar={() => vm.pedirQuitarProducto(id)}
                  onCelda={(clave) => vm.seleccionarCelda(id, clave)}
                  onCantidadTexto={vm.cambiarCantidadTexto}
                  onMas={vm.incrementar}
                  onMenos={vm.decrementar}
                  onCosto={(t) => vm.cambiarCosto(id, t)}
                  onPrecio={(t) => vm.cambiarPrecio(id, t)}
                  onUsarSugerido={() => vm.usarSugerido(id)}
                />
              );
            })}

            <Pressable
              accessibilityRole="button"
              onPress={vm.abrirSelector}
              style={({ pressed }) => [styles.agregar, pressed ? styles.agregarPressed : null]}
            >
              <Ionicons name="add" size={18} color={colors.accent} />
              <AppText variant="bodyMedium" color={colors.accent} style={styles.semi}>
                Agregar producto
              </AppText>
            </Pressable>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.footerInfo}>
              <AppText variant="caption">
                {vm.resumen.piezas} piezas · {vm.lote.length} {vm.lote.length === 1 ? 'producto' : 'productos'}
              </AppText>
              <AppText style={styles.total}>{formatPrecio(vm.resumen.total)}</AppText>
            </View>
            <Button title="Revisar entrada" onPress={vm.irAResumen} disabled={!vm.resumen.listo} />
          </View>
        </KeyboardAvoidingView>
      )}

      <AgregarProductoSheet
        visible={vm.selectorAbierto}
        enLote={vm.lote.map((p) => p.matriz.producto.id)}
        agregando={vm.agregando}
        error={vm.errorAgregar}
        onElegir={(id) => void vm.agregarProducto(id)}
        onCerrar={vm.cerrarSelector}
      />
      <ConfirmSheet
        visible={vm.quitarPendiente}
        title="¿Quitar el producto del lote?"
        message="Se perderán las piezas, el costo y el precio capturados para este producto."
        cancelLabel="Conservarlo"
        onCancel={vm.cancelarQuitar}
        confirmLabel="Quitar"
        onConfirm={vm.confirmarQuitar}
      />
      <ConfirmSheet
        visible={vm.confirmarSalida}
        title="¿Descartar la entrada?"
        message="Tienes una entrada sin registrar. Si sales, se perderá lo capturado."
        cancelLabel="Seguir capturando"
        onCancel={vm.seguirCapturando}
        confirmLabel="Salir y descartar"
        onConfirm={vm.descartarYSalir}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  flex: { flex: 1 },
  semi: { fontFamily: fonts.bodySemi },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  back: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  input: { marginBottom: 0 },
  agregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  agregarPressed: { backgroundColor: colors.accentSoft },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
    gap: spacing.sm,
  },
  footerInfo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  total: { fontFamily: fonts.headingExtra, fontSize: fontSize.xxl, color: colors.text.price },
  totales: { gap: spacing.xs },
  okScroll: { padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  okIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
