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

import { AppText, Banner, Button, ConfirmSheet } from '@/components/ui';
import { formatFechaLimite } from '@/data/models/apartado';
import { nombreCliente } from '@/data/models/cliente';
import { formatPrecio } from '@/data/models/producto';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { ClienteSelectorSheet } from '@/features/ventas/components/ClienteSelectorSheet';
import { PagoEditor } from '@/features/ventas/components/PagoEditor';
import { PagoResumido } from '@/features/ventas/components/PagoResumido';
import { ResumenFila } from '@/features/ventas/components/ResumenFila';
import { VentaCarrito } from '@/features/ventas/components/VentaCarrito';
import { VentaClienteCard } from '@/features/ventas/components/VentaClienteCard';
import { useNuevoApartadoViewModel } from '@/features/apartados/viewmodels/useNuevoApartadoViewModel';

/**
 * "Nuevo apartado": cliente (obligatorio) + productos → anticipo → registro.
 * Reutiliza las piezas del POS (carrito, hoja de cliente y la captura de pagos
 * combinados): el anticipo puede ir en uno o varios métodos.
 * La lógica vive en `useNuevoApartadoViewModel`.
 */
export function NuevoApartadoScreen() {
  const insets = useSafeAreaInsets();
  const vm = useNuevoApartadoViewModel();
  const { retroceder } = vm;

  // Android: atrás primero regresa de Anticipo a la captura.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', retroceder);
      return () => sub.remove();
    }, [retroceder]),
  );

  const enAnticipo = vm.modo === 'anticipo' && !vm.creado;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={enAnticipo ? 'Volver a productos' : 'Volver'}
          onPress={enAnticipo ? vm.volverACaptura : vm.salir}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.main} />
        </Pressable>
        <AppText variant="heading" style={styles.title}>
          {vm.creado ? 'Apartado registrado' : enAnticipo ? 'Anticipo' : 'Nuevo apartado'}
        </AppText>
      </View>

      {vm.creado ? (
        <Confirmacion vm={vm} />
      ) : enAnticipo ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <AppText variant="label">Total del apartado</AppText>
              <AppText style={styles.heroMonto}>{formatPrecio(vm.total)}</AppText>
              <AppText variant="caption">
                {vm.cliente ? nombreCliente(vm.cliente) : ''} · {vm.totalItems}{' '}
                {vm.totalItems === 1 ? 'artículo' : 'artículos'}
              </AppText>
            </View>

            {vm.error ? <Banner variant="error">{vm.error}</Banner> : null}

            <View style={styles.section}>
              <View style={styles.cardHeader}>
                <AppText variant="label">Anticipo (opcional)</AppText>
                <View style={styles.atajos}>
                  <AppText variant="link" style={styles.atajo} onPress={vm.sinAnticipo}>
                    Sin anticipo
                  </AppText>
                  <AppText variant="link" style={styles.atajo} onPress={vm.anticipoTotal}>
                    Total
                  </AppText>
                </View>
              </View>

              {vm.pagos.map((p) =>
                p.id === vm.activoId ? (
                  <PagoEditor
                    key={p.id}
                    pago={p}
                    error={vm.erroresPago[p.id]}
                    sugerencias={vm.sugerencias[p.id]}
                    puedeQuitar={vm.pagos.length > 1}
                    mostrarReferencia={false}
                    deshabilitado={vm.enviando}
                    onCambiar={vm.actualizarPago}
                    onQuitar={vm.quitarPago}
                  />
                ) : (
                  <PagoResumido
                    key={p.id}
                    pago={p}
                    monto={vm.montos[p.id] ?? null}
                    deshabilitado={vm.enviando}
                    onEditar={vm.activarPago}
                    onQuitar={vm.quitarPago}
                  />
                ),
              )}

              <Pressable
                accessibilityRole="button"
                onPress={() => vm.agregarPago()}
                disabled={vm.enviando}
                hitSlop={6}
                style={({ pressed }) => [styles.agregar, pressed ? styles.agregarPressed : null]}
              >
                <Ionicons name="add" size={18} color={colors.accent} />
                <AppText variant="bodyMedium" color={colors.accent} style={styles.agregarText}>
                  {vm.pagos.length === 0 ? 'Agregar forma de pago' : 'Dividir con otra forma de pago'}
                </AppText>
              </Pressable>
            </View>

            {vm.errorPagos ? <Banner variant="error">{vm.errorPagos}</Banner> : null}

            {vm.liquidaEnElActo ? (
              <Banner variant="info">
                El anticipo cubre el total: el apartado quedará liquidado y la mercancía se entrega
                en este momento.
              </Banner>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.totales}>
              <Total etiqueta="Anticipo" valor={formatPrecio(vm.anticipo)} />
              <Total
                etiqueta="Cambio"
                valor={formatPrecio(vm.cambio)}
                color={vm.cambio > 0 ? colors.green : colors.text.muted}
              />
              <Total
                etiqueta="Saldo pendiente"
                valor={formatPrecio(vm.saldo)}
                color={vm.liquidaEnElActo ? colors.green : colors.text.price}
              />
            </View>
            <Button
              title="Registrar apartado"
              onPress={vm.registrar}
              loading={vm.enviando}
              disabled={!vm.puedeRegistrar}
            />
          </View>
        </KeyboardAvoidingView>
      ) : (
        <>
          <View style={styles.cliente}>
            <VentaClienteCard
              cliente={vm.cliente}
              sinCliente={false}
              onBuscar={vm.abrirSelectorCliente}
              onQuitar={vm.quitarCliente}
              textoVacio="Obligatorio para apartar"
            />
          </View>
          <View style={styles.flex}>
            <VentaCarrito
              items={vm.items}
              totalItems={vm.totalItems}
              onAgregar={vm.agregarProducto}
              onInc={vm.incrementar}
              onDec={vm.decrementar}
              onRemove={vm.quitarItem}
            />
          </View>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.footerInfo}>
              <AppText variant="caption">
                {!vm.cliente ? 'Falta elegir al cliente' : `${vm.totalItems} ${vm.totalItems === 1 ? 'artículo' : 'artículos'}`}
              </AppText>
              <AppText style={styles.total}>{formatPrecio(vm.total)}</AppText>
            </View>
            <Button title="Continuar" onPress={vm.irAAnticipo} disabled={!vm.puedeContinuar} />
          </View>
        </>
      )}

      <ClienteSelectorSheet
        visible={vm.selectorClienteAbierto}
        titulo="Cliente del apartado"
        onElegir={vm.elegirCliente}
        onCerrar={vm.cerrarSelectorCliente}
      />
      <ConfirmSheet
        visible={vm.confirmarSalida}
        title="¿Descartar el apartado?"
        message="Tienes un apartado sin registrar. Si sales, se perderán el cliente, los productos y el anticipo."
        cancelLabel="Seguir capturando"
        onCancel={vm.seguirCapturando}
        confirmLabel="Salir y descartar"
        onConfirm={vm.descartarYSalir}
      />
    </View>
  );
}

/** Vista final: folio, fecha límite y saldo del apartado recién creado. */
function Confirmacion({ vm }: { vm: ReturnType<typeof useNuevoApartadoViewModel> }) {
  const insets = useSafeAreaInsets();
  const c = vm.creado;
  if (!c) return null;
  const liquidado = c.estado === 'completado';

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.okScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.okIcon}>
          <Ionicons name={liquidado ? 'checkmark-done' : 'bookmark'} size={36} color={colors.green} />
        </View>
        <AppText variant="subtitle" center>
          {liquidado ? '¡Apartado liquidado!' : '¡Apartado registrado!'}
        </AppText>
        <AppText variant="caption" center>
          Folio #{c.apartadoId} · {c.clienteNombre}
        </AppText>

        {c.cambio > 0 ? (
          <View style={styles.cambioBox}>
            <AppText variant="label" color={colors.green}>
              Cambio a entregar
            </AppText>
            <AppText style={styles.cambioMonto}>{formatPrecio(c.cambio)}</AppText>
          </View>
        ) : null}

        {c.aviso ? <Banner variant="error">{c.aviso}</Banner> : null}

        <View style={styles.card}>
          <ResumenFila etiqueta="Total" valor={formatPrecio(c.total)} />
          {c.pagos.length === 0 ? (
            <ResumenFila etiqueta="Anticipo" valor="Sin anticipo" />
          ) : (
            c.pagos.map((p, i) => (
              <ResumenFila key={i} etiqueta={`Anticipo · ${p.metodo}`} valor={formatPrecio(p.monto)} />
            ))
          )}
          <ResumenFila etiqueta="Saldo pendiente" valor={formatPrecio(c.saldo)} destacado />
          {!liquidado ? (
            <ResumenFila etiqueta="Fecha límite" valor={formatFechaLimite(c.fechaLimite)} />
          ) : null}
        </View>
        {liquidado ? (
          <Banner variant="success">La mercancía se entrega en este momento.</Banner>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button title="Ver apartado" onPress={vm.verApartado} />
        <Button title="Nuevo apartado" variant="secondary" onPress={vm.otroApartado} />
      </View>
    </View>
  );
}

function Total({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <View style={styles.totalCol}>
      <AppText variant="caption">{etiqueta}</AppText>
      <AppText variant="bodyMedium" color={color} numberOfLines={1}>
        {valor}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  back: { padding: spacing.xs },
  title: { fontFamily: fonts.heading, flex: 1 },
  cliente: { paddingHorizontal: spacing.lg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  heroMonto: { fontFamily: fonts.headingExtra, fontSize: fontSize.title, color: colors.text.price },
  card: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  atajos: { flexDirection: 'row', gap: spacing.md },
  atajo: { fontSize: fontSize.sm },
  section: { gap: spacing.sm },
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
  agregarText: { fontFamily: fonts.bodySemi },
  cambioBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  cambioMonto: { fontFamily: fonts.headingExtra, fontSize: fontSize.title, color: colors.green },
  totalCol: { flex: 1, alignItems: 'center', gap: 2 },
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
  totales: { flexDirection: 'row', gap: spacing.sm },
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
