import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Episodio } from '@domain/entities/ContextoSaude';
import { NIVEIS } from '@domain/entities/Triagem';
import { Card } from '@presentation/components/ui';
import { dataHoraCurta } from '@core/utils/formato';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  episodios: Episodio[];
  selecionado: string | null;
  onEscolher: (id: string) => void;
}

/** Mais de um problema nas últimas 24 h: a pessoa diz qual leva ao atendimento. */
export function EscolhaEpisodio({ episodios, selecionado, onEscolher }: Props) {
  return (
    <Card titulo="Sobre o que é este atendimento?">
      {episodios.map((e) => {
        const ativo = e.id === selecionado;
        const nivel = e.ultimaTriagem ? NIVEIS[e.ultimaTriagem.triagem.nivel].texto : null;
        const titulo = e.rotulo ?? e.entradas[e.entradas.length - 1].descricao.slice(0, 50);
        return (
          <Pressable
            key={e.id}
            onPress={() => onEscolher(e.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: ativo }}
            style={[styles.opcao, ativo && styles.ativa]}
          >
            <View style={[styles.marca, ativo && styles.marcaAtiva]} />
            <View style={styles.texto}>
              <Text style={styles.titulo}>{titulo}</Text>
              <Text style={styles.detalhe}>
                {dataHoraCurta(e.fim)}
                {nivel ? ` · ${nivel}` : ''}
                {e.entradas.length > 1 ? ` · ${e.entradas.length} relatos` : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  ativa: { borderColor: colors.greenMedium, backgroundColor: colors.greenAccent },
  marca: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.grayMedium },
  marcaAtiva: { borderColor: colors.greenDark, backgroundColor: colors.greenDark },
  texto: { flex: 1, gap: 2 },
  titulo: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.text, textTransform: 'capitalize' },
  detalhe: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textLight },
});
