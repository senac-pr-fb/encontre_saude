import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import type { EpisodioAnterior } from '@domain/entities/Triagem';
import { dataHoraCurta } from '@core/utils/formato';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  episodio: EpisodioAnterior;
  onDesfazer: () => void;
  desfazendo: boolean;
  desfeito: boolean;
}

/**
 * Mostra a ligação que a IA fez com um relato anterior e deixa desfazer:
 * a consistência do histórico não depende de a IA acertar.
 */
export function VinculoEpisodio({ episodio, onDesfazer, desfazendo, desfeito }: Props) {
  if (desfeito) {
    return (
      <View style={styles.faixa}>
        <FontAwesome6 name="link-slash" size={12} color={colors.greenDark} />
        <Text style={styles.texto}>Registrado como uma queixa separada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.faixa}>
      <FontAwesome6 name="link" size={12} color={colors.greenDark} />
      <Text style={styles.texto}>
        Entendemos como continuação de {episodio.rotulo ?? 'um relato anterior'} (desde{' '}
        {dataHoraCurta(episodio.desde)}).
      </Text>
      <Pressable onPress={onDesfazer} disabled={desfazendo} accessibilityRole="button" hitSlop={8}>
        <Text style={[styles.acao, desfazendo && styles.desabilitada]}>Não é isso</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenAccent,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  texto: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.greenDark, lineHeight: 17 },
  acao: { fontFamily: fonts.semibold, fontSize: fontSizes.xs, color: colors.greenDark, textDecorationLine: 'underline' },
  desabilitada: { opacity: 0.5 },
});
