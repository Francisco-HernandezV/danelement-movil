import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, ConfirmSheet } from '@/components/ui';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, spacing } from '@/theme';
import { ClienteSelectorSheet } from '@/features/ventas/components/ClienteSelectorSheet';
import { VentaCarrito } from '@/features/ventas/components/VentaCarrito';
import { VentaClienteCard } from '@/features/ventas/components/VentaClienteCard';
import { VentaConfirmacion } from '@/features/ventas/components/VentaConfirmacion';
import { VentaPago } from '@/features/ventas/components/VentaPago';
import { usePuntoVentaViewModel } from '@/features/ventas/viewmodels/usePuntoVentaViewModel';

/**
 * Pantalla del Punto de Venta.
 *
 * Una sola vista de trabajo (cliente opcional, buscador y carrito, con
 * "Cobrar" abajo), la vista de cobro y la confirmación. Toda la lógica
 * (vista actual, cliente, salida protegida) vive en `usePuntoVentaViewModel`.
 */
export function VentaScreen() {
  const insets = useSafeAreaInsets();
  const vm = usePuntoVentaViewModel();
  const { retroceder } = vm;

  // Android: el botón atrás primero regresa de Cobrar a la venta. En la venta
  // no lo consumimos y la navegación intenta salir (lo intercepta `usePreventRemove`).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', retroceder);
      return () => sub.remove();
    }, [retroceder]),
  );

  const enPago = vm.modo === 'pago';
  const enConfirmacion = vm.modo === 'confirmacion';

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      {/* Encabezado */}
      <View style={styles.header}>
        {enPago ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a la venta"
            onPress={vm.volverAVenta}
            hitSlop={10}
            style={styles.headerLeft}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text.main} />
            <AppText variant="bodyMedium">Venta</AppText>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salir del punto de venta"
            onPress={vm.salir}
            hitSlop={10}
            style={styles.headerLeft}
          >
            <Ionicons name="close" size={22} color={colors.text.main} />
            <AppText variant="bodyMedium">Salir</AppText>
          </Pressable>
        )}
        <AppText variant="subtitle" center style={styles.title}>
          {enPago ? 'Cobrar' : 'Punto de venta'}
        </AppText>
        <View style={styles.headerRight}>
          {vm.hayVentaEnCurso && !enConfirmacion ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Descartar y empezar una nueva venta"
              onPress={vm.nuevaVenta}
              hitSlop={8}
            >
              <AppText variant="link">Nueva</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {vm.modo === 'venta' ? (
        <>
          <View style={styles.cliente}>
            <VentaClienteCard
              cliente={vm.cliente}
              sinCliente={false}
              onBuscar={vm.abrirSelectorCliente}
              onQuitar={vm.ventaDeMostrador}
            />
          </View>

          <View style={styles.body}>
            <VentaCarrito
              items={vm.items}
              totalItems={vm.totalItems}
              onAgregar={vm.agregarProducto}
              onInc={vm.incrementar}
              onDec={vm.decrementar}
              onRemove={vm.quitarItem}
            />
          </View>

          {/* Barra inferior: total y cobrar */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.footerInfo}>
              <AppText variant="caption">
                {vm.totalItems} {vm.totalItems === 1 ? 'artículo' : 'artículos'}
              </AppText>
              <AppText style={styles.total}>{formatPrecio(vm.subtotal)}</AppText>
            </View>
            <Button title="Cobrar" onPress={vm.irAPagar} disabled={vm.carritoVacio} />
          </View>
        </>
      ) : enPago ? (
        <VentaPago cliente={vm.cliente} totalItems={vm.totalItems} onCobrada={vm.onCobrada} />
      ) : vm.ventaCobrada ? (
        <VentaConfirmacion
          venta={vm.ventaCobrada}
          onNuevaVenta={vm.nuevaVenta}
          onSalir={vm.salir}
          onComprobante={vm.compartirComprobante}
          generandoComprobante={vm.generandoComprobante}
          errorComprobante={vm.errorComprobante}
        />
      ) : null}

      <ClienteSelectorSheet
        visible={vm.selectorClienteAbierto}
        onElegir={vm.elegirCliente}
        onMostrador={vm.ventaDeMostrador}
        onCerrar={vm.cerrarSelectorCliente}
      />
      <ConfirmSheet
        visible={vm.confirmacion === 'salir'}
        title="Salir del punto de venta"
        message="Tienes una venta en curso. Si sales, se perderán el cliente y los productos agregados."
        cancelLabel="Seguir con la venta"
        onCancel={vm.seguirConVenta}
        confirmLabel="Salir y descartar"
        onConfirm={vm.descartar}
      />
      <ConfirmSheet
        visible={vm.confirmacion === 'nueva'}
        title="¿Empezar una nueva venta?"
        message="Se descartarán el cliente y los productos de la venta actual."
        cancelLabel="Seguir con la venta"
        onCancel={vm.seguirConVenta}
        confirmLabel="Descartar y empezar otra"
        onConfirm={vm.descartar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minWidth: 72 },
  title: { flex: 1, fontFamily: fonts.heading },
  headerRight: { minWidth: 72, alignItems: 'flex-end' },
  cliente: { paddingHorizontal: spacing.lg },
  body: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.footer,
    gap: spacing.sm,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  total: { fontFamily: fonts.headingExtra, fontSize: fontSize.xxl, color: colors.text.price },
});
