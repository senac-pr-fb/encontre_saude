import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { NIVEIS, type Triagem } from '@domain/entities/Triagem';
import { rotuloDoSintoma } from '@domain/entities/PreProntuario';
import { colors, fonts, fontSizes, radius, shadows, spacing } from '@presentation/theme';

/** Cor do nível é fundo; o texto precisa contrastar com amarelo e verde-limão. */
const textoSobre = (nivel: keyof typeof NIVEIS) => (nivel === 2 || nivel === 3 ? colors.blackDark : colors.white);

export function ResultadoTriagem({ triagem }: { triagem: Triagem }) {
  const nivel = NIVEIS[triagem.nivel];

  return (
    <View style={styles.card}>
      <View style={[styles.faixa, { backgroundColor: nivel.cor }]}>
        <Text style={[styles.faixaTexto, { color: textoSobre(triagem.nivel) }]}>
          Nível {triagem.nivel} · {nivel.texto}
        </Text>
      </View>

      <View style={styles.corpo}>
        <Secao icone="clipboard-question" titulo="Resumo" texto={triagem.resumo} />
        <Secao icone="lightbulb" titulo="Recomendação" texto={triagem.recomendacao} />
        {triagem.primeirosSocorros ? (
          <Secao icone="kit-medical" titulo="Primeiros socorros" texto={triagem.primeirosSocorros} />
        ) : null}
        {triagem.unidadeRecomendada ? (
          <Secao icone="hospital" titulo="Onde procurar atendimento" texto={triagem.unidadeRecomendada} />
        ) : null}

        {triagem.sintomas.length > 0 ? (
          <View style={styles.secao}>
            <Text style={styles.titulo}>Sintomas identificados</Text>
            <View style={styles.tags}>
              {triagem.sintomas.map((s) => (
                <Text key={s} style={styles.tag}>
                  {rotuloDoSintoma(s)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Secao({ icone, titulo, texto }: { icone: string; titulo: string; texto: string }) {
  if (!texto) return null;
  return (
    <View style={styles.secao}>
      <View style={styles.tituloLinha}>
        <FontAwesome6 name={icone} size={12} color={colors.greenMedium} />
        <Text style={styles.titulo}>{titulo}</Text>
      </View>
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, overflow: 'hidden', ...shadows.sm },
  faixa: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  faixaTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md },
  corpo: { padding: spacing.md, gap: spacing.md },
  secao: { gap: spacing.xs },
  tituloLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  titulo: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.greenDark },
  texto: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.greenAccent,
    color: colors.greenDark,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});
