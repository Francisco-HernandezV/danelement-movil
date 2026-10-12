import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import { AppText } from './Typography';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

interface InputProps extends TextInputProps {
  label?: string;
  /** Mensaje de error; pinta el borde en rojo y lo muestra debajo. */
  error?: string;
  /** Muestra un botón "Mostrar/Ocultar" y maneja `secureTextEntry` internamente. */
  secureToggle?: boolean;
  /** Elemento a la izquierda del campo (p. ej. un ícono de lupa). */
  leftAccessory?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, secureToggle, leftAccessory, containerStyle, style, onChangeText, onFocus, onBlur, secureTextEntry, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const hasError = Boolean(error);

  // Guardamos los callbacks en refs y exponemos wrappers ESTABLES. Así las
  // props del TextInput no cambian de identidad en cada render; en Android
  // (New Architecture) pasar nuevas funciones/estilos por tecla hace que el
  // input pierda el foco y se cierre el teclado. Con esto, al tipear solo
  // cambia `value`.
  const onChangeRef = useRef(onChangeText);
  onChangeRef.current = onChangeText;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const handleChangeText = useCallback((text: string) => onChangeRef.current?.(text), []);
  const handleFocus = useCallback<FocusHandler>((e) => {
    setFocused(true);
    onFocusRef.current?.(e);
  }, []);
  const handleBlur = useCallback<BlurHandler>((e) => {
    setFocused(false);
    onBlurRef.current?.(e);
  }, []);

  // Estilos como referencias estables (sin arrays/objetos nuevos por render).
  const containerCombined = useMemo(
    () => (containerStyle ? [styles.container, containerStyle] : styles.container),
    [containerStyle],
  );
  const inputStyle = useMemo(() => (style ? [styles.input, style] : styles.input), [style]);
  const fieldStyle = hasError ? styles.fieldError : focused ? styles.fieldFocused : styles.field;

  return (
    <View style={containerCombined}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View style={fieldStyle}>
        {leftAccessory ? <View style={styles.leftAccessory}>{leftAccessory}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.accent}
          {...rest}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          style={inputStyle}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setHidden((v) => !v)}
            style={styles.toggle}
          >
            <AppText variant="link" style={styles.toggleText}>
              {hidden ? 'Mostrar' : 'Ocultar'}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <AppText variant="caption" color={colors.red} style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const fieldBase = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.bg.input,
  borderWidth: 1,
  borderRadius: radius.md,
  paddingHorizontal: spacing.md,
} as const;

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm },
  field: { ...fieldBase, borderColor: colors.border },
  fieldFocused: {
    ...fieldBase,
    borderColor: colors.accent,
    backgroundColor: colors.bg.inputFocus,
    boxShadow: '0px 0px 4px rgba(59, 130, 246, 0.35)',
  },
  fieldError: { ...fieldBase, borderColor: colors.red },
  input: {
    flex: 1,
    color: colors.text.main,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  leftAccessory: { paddingRight: spacing.sm },
  toggle: { paddingLeft: spacing.sm },
  toggleText: { fontSize: fontSize.sm },
  errorText: { marginTop: spacing.xs },
});
