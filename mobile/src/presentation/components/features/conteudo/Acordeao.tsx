import { ReactNode, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, fonts, fontSizes, radius, shadows, spacing } from '@presentation/theme';

interface Props {
  titulo: string;
  icone?: string;
  children: ReactNode;
}

/** Card expansível — no site cada tópico abre num painel; aqui, em acordeão. */
export function Acordeao({ titulo, icone, children }: Props) {
  const [aberto, setAberto] = useState(false);

  const alternar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAberto((v) => !v);
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={alternar}
        style={styles.cabecalho}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
      >
        {icone ? <FontAwesome6 name={icone} size={18} color={colors.greenMedium} style={styles.icone} /> : null}
        <Text style={styles.titulo}>{titulo}</Text>
        <FontAwesome6 name={aberto ? 'chevron-up' : 'chevron-down'} size={14} color={colors.grayMedium} />
      </Pressable>
      {aberto ? <View style={styles.corpo}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  icone: { width: 24, textAlign: 'center' },
  titulo: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.greenDark },
  corpo: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.greenAccent,
    paddingTop: spacing.md,
  },
});
