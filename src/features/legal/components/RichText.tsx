import { StyleSheet } from 'react-native';

import { AppText, type TextVariant } from '@/components/ui';
import { colors, fonts } from '@/theme';

/** Divide `texto` en fragmentos normales y **negritas**. */
function fragmentos(texto: string): { texto: string; negrita: boolean }[] {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((parte) =>
      parte.startsWith('**') && parte.endsWith('**')
        ? { texto: parte.slice(2, -2), negrita: true }
        : { texto: parte, negrita: false },
    );
}

interface RichTextProps {
  texto: string;
  variant?: TextVariant;
  color?: string;
}

/** Texto de los documentos legales con soporte de **negritas**. */
export function RichText({ texto, variant = 'body', color = colors.text.main }: RichTextProps) {
  return (
    <AppText variant={variant} color={color} style={styles.base}>
      {fragmentos(texto).map((f, i) =>
        f.negrita ? (
          <AppText key={i} variant={variant} color={colors.text.main} style={styles.negrita}>
            {f.texto}
          </AppText>
        ) : (
          f.texto
        ),
      )}
    </AppText>
  );
}

const styles = StyleSheet.create({
  base: { lineHeight: 22 },
  negrita: { fontFamily: fonts.bodySemi, lineHeight: 22 },
});
