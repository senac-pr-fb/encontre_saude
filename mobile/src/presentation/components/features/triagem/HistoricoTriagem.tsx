import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { NIVEIS, type InteracaoHistorico } from '@domain/entities/Triagem';
import { rotuloDoSintoma } from '@domain/entities/PreProntuario';
import { Acordeao } from '@presentation/components/features/conteudo/Acordeao';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  interacoes: InteracaoHistorico[];
  carregando: boolean;
}

/**
 * No site o histórico aparece em dois lugares (painel na home e seção no
 * perfil). Aqui fica só embaixo da triagem, onde tem contexto.
 */
export function HistoricoTriagem({ interacoes, carregando }: Props) {
  const titulo = `Histórico de consultas${interacoes.length ? ` (${interacoes.length})` : ''}`;

  return (
    <Acordeao titulo={titulo} icone="clock-rotate-left">
      {carregando ? (
        <Text style={styles.vazio}>Carregando...</Text>
      ) : interacoes.length === 0 ? (
        <Text style={styles.vazio}>
          Nenhuma consulta salva ainda. Suas triagens e pré-prontuários aparecerão aqui.
        </Text>
      ) : (
        interacoes.map((i) => <Item key={i.id} interacao={i} />)
      )}
    </Acordeao>
  );
}

function Item({ interacao }: { interacao: InteracaoHistorico }) {
  const nivel = interacao.triagem ? NIVEIS[interacao.triagem.nivel] : null;
  const data = new Date(interacao.quando).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.item}>
      <View style={styles.cabecalho}>
        <FontAwesome6
          name={interacao.triagem ? 'robot' : 'file-medical'}
          size={11}
          color={colors.textLight}
        />
        <Text style={styles.data}>{data}</Text>
        {nivel ? (
          <View style={[styles.selo, { backgroundColor: nivel.cor }]}>
            <Text style={[styles.seloTexto, { color: interacao.triagem!.nivel >= 4 ? colors.white : colors.blackDark }]}>
              {nivel.texto}
            </Text>
          </View>
        ) : (
          <View style={[styles.selo, styles.seloProntuario]}>
            <Text style={styles.seloTexto}>Pré-prontuário</Text>
          </View>
        )}
      </View>

      <Text style={styles.descricao} numberOfLines={4}>
        {interacao.descricao}
      </Text>

      {interacao.triagem?.recomendacao ? (
        <Text style={styles.recomendacao} numberOfLines={3}>
          {interacao.triagem.recomendacao}
        </Text>
      ) : null}

      {interacao.sintomas.length > 0 ? (
        <Text style={styles.sintomas}>{interacao.sintomas.map(rotuloDoSintoma).join(' · ')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  item: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  data: { flex: 1, fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight },
  selo: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.xl },
  seloProntuario: { backgroundColor: colors.grayLight },
  seloTexto: { fontFamily: fonts.semibold, fontSize: 10, color: colors.textLight },
  descricao: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 20 },
  recomendacao: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textLight, lineHeight: 17 },
  sintomas: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.greenDark },
});
