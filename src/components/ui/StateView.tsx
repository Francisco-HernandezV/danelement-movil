import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './Typography';
import { Button } from './Button';

interface StateViewProps {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Bloque centrado para estados de carga, vacío o error. */
export function StateView({ kind, title, message, actionLabel, onAction }: StateViewProps) {
  return (
    <View style={styles.block}>
      {kind === 'loading' ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : null}
      <AppText variant="subtitle" center>
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" center style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="secondary" fullWidth={false} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  message: { maxWidth: 320 },
});
