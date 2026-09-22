import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, shadows, spacing } from '@presentation/theme';

interface Props extends PropsWithChildren {
  titulo?: string;
}

/** Bloco branco arredondado — a "seção" da ficha, equivalente aos cards do site. */
export function Card({ titulo, children }: Props) {
  return (
    <View style={styles.card}>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      <View style={styles.conteudo}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  titulo: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.lg,
    color: colors.greenDark,
    borderBottomWidth: 2,
    borderBottomColor: colors.greenAccent,
    paddingBottom: spacing.sm,
  },
  conteudo: { gap: spacing.md },
});
