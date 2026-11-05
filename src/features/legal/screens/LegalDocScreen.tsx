import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Heading } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { RichText } from '@/features/legal/components/RichText';
import type { LegalBlock, LegalDoc } from '@/features/legal/content/types';

/**
 * Muestra un documento legal (Términos o Aviso de privacidad) dentro de la
 * app, sin abrir el navegador. Al volver, la pantalla anterior (por ejemplo,
 * el registro) conserva lo que el usuario ya había escrito.
 */
export function LegalDocScreen({ doc }: { doc: LegalDoc }) {
  const insets = useSafeAreaInsets();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.backBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          onPress={goBack}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.main} />
          <AppText variant="bodyMedium">Volver</AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Heading>{doc.titulo}</Heading>
        <AppText variant="caption" style={styles.meta}>
          Versión {doc.version} · Vigente desde el {doc.vigencia}
        </AppText>
        {doc.introduccion ? <RichText texto={doc.introduccion} /> : null}

        {doc.secciones.map((seccion) => (
          <View key={seccion.titulo} style={styles.seccion}>
            <AppText variant="subtitle" style={styles.seccionTitulo}>
              {seccion.titulo}
            </AppText>
            {seccion.bloques.map((bloque, i) => (
              <Bloque key={i} bloque={bloque} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Bloque({ bloque }: { bloque: LegalBlock }) {
  switch (bloque.tipo) {
    case 'parrafo':
      return <RichText texto={bloque.texto} color={colors.text.muted} />;

    case 'nota':
      return (
        <View style={styles.nota}>
          <RichText texto={bloque.texto} color={colors.text.muted} />
        </View>
      );

    case 'lista':
      return (
        <View style={styles.lista}>
          {bloque.items.map((item, i) => (
            <View key={i} style={styles.item}>
              <AppText variant="body" color={colors.accent} style={styles.vineta}>
                {bloque.ordenada ? `${i + 1}.` : '•'}
              </AppText>
              <View style={styles.itemTexto}>
                <RichText texto={item} color={colors.text.muted} />
              </View>
            </View>
          ))}
        </View>
      );

    case 'tabla':
      // En pantallas angostas una tabla no cabe: cada fila es una tarjeta.
      return (
        <View style={styles.tabla}>
          {bloque.filas.map((fila, i) => (
            <View key={i} style={styles.fila}>
              <AppText variant="bodyMedium">{fila[0]}</AppText>
              {fila.slice(1).map((celda, j) => (
                <View key={j} style={styles.celda}>
                  <AppText variant="caption">{bloque.columnas[j + 1]}</AppText>
                  <RichText texto={celda} color={colors.text.muted} />
                </View>
              ))}
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.body },
  backBar: { paddingHorizontal: spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  meta: { marginTop: -spacing.xs },
  seccion: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  seccionTitulo: { marginBottom: spacing.xs },
  nota: {
    backgroundColor: colors.bg.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  lista: { gap: spacing.sm },
  item: { flexDirection: 'row', gap: spacing.sm },
  vineta: { minWidth: 20, lineHeight: 22 },
  itemTexto: { flex: 1 },
  tabla: { gap: spacing.sm },
  fila: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  celda: { gap: 2 },
});
