import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Envuelve el contenido en un ScrollView (ideal para formularios). */
  scroll?: boolean;
  /** Centra el contenido vertical y horizontalmente. */
  center?: boolean;
  /** Aplica el gutter lateral de 16px (por defecto `true`). */
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Contenedor de pantalla: fondo oscuro de marca, respeto del área segura,
 * gutter lateral consistente y, opcionalmente, scroll + KeyboardAvoidingView.
 */
export function Screen({ children, scroll = false, center = false, padded = true, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const padding: ViewStyle = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing.lg,
    paddingHorizontal: padded ? spacing.lg : 0,
  };

  const inner = (
    <View style={[styles.inner, center && styles.center, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, padding, center && styles.center]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, padding]}>{inner}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.body },
  scrollContent: { flexGrow: 1, backgroundColor: colors.bg.body },
  inner: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'stretch' },
});
