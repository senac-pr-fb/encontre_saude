import { StyleSheet, Text, View } from 'react-native';
import type { ContextoSaude, Episodio } from '@domain/entities/ContextoSaude';
import type { HistoricoRecenteDocumento } from '@domain/entities/PreProntuario';
import { NIVEIS } from '@domain/entities/Triagem';
import { rotuloDoSintoma } from '@domain/entities/PreProntuario';
import { Card } from '@presentation/components/ui';
import { textoSobreNivel } from '@presentation/components/features/triagem/ResultadoTriagem';
import { dataHoraCurta, dataParaBR, mascararCPF, mascararTelefone } from '@core/utils/formato';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  contexto: ContextoSaude;
  episodio: Episodio | null;
  historicoRecente?: HistoricoRecenteDocumento;
}

/** O que vai no PDF, lido do contexto de saúde, para conferir antes de gerar. */
export function PreviaDocumento({ contexto, episodio, historicoRecente }: Props) {
  const { perfil, nome } = contexto;
  const triagem = episodio?.ultimaTriagem?.triagem;
  const nivel = triagem ? NIVEIS[triagem.nivel] : null;
  const clinico = [
    ['Alergias', perfil.alergias],
    ['Medicamentos em uso', perfil.medicamentosEmUso],
    ['Doenças preexistentes', perfil.doencasPreexistentes],
  ] as const;
  const varios = (episodio?.entradas.length ?? 0) > 1;

  return (
    <>
      {episodio && triagem && nivel ? (
        <Card titulo="Queixa">
          <View style={styles.linhaSelo}>
            <View style={[styles.selo, { backgroundColor: nivel.cor }]}>
              <Text style={[styles.seloTexto, { color: textoSobreNivel(triagem.nivel) }]}>
                Nível {triagem.nivel} · {nivel.texto}
              </Text>
            </View>
            <Text style={styles.data}>
              {varios ? `desde ${dataHoraCurta(episodio.inicio)}` : dataHoraCurta(episodio.fim)}
            </Text>
          </View>
          {/* Vários relatos do mesmo problema: a evolução importa para quem atende. */}
          {episodio.entradas.map((e) => (
            <View key={e.id} style={varios ? styles.relato : undefined}>
              {varios ? <Text style={styles.rotulo}>{dataHoraCurta(e.quando)}</Text> : null}
              <Text style={styles.valor}>{e.descricao}</Text>
            </View>
          ))}
          {episodio.sintomas.length > 0 ? (
            <Text style={styles.sintomas}>{episodio.sintomas.map(rotuloDoSintoma).join(' · ')}</Text>
          ) : null}
        </Card>
      ) : null}

      <Card titulo="Seus dados">
        <Linha rotulo="Nome" valor={nome} />
        <Linha rotulo="Nascimento" valor={dataParaBR(perfil.dataNascimento)} />
        <Linha rotulo="CPF" valor={perfil.cpf ? mascararCPF(perfil.cpf) : null} />
        <Linha rotulo="Sexo" valor={perfil.sexo} />
        <Linha rotulo="Telefone" valor={perfil.telefone ? mascararTelefone(perfil.telefone) : null} />
      </Card>

      <Card titulo="Histórico clínico">
        {clinico.some(([, v]) => v) ? (
          clinico.map(([rotulo, valor]) => <Linha key={rotulo} rotulo={rotulo} valor={valor} />)
        ) : (
          <Text style={styles.vazio}>Nada informado na sua ficha.</Text>
        )}
      </Card>

      {historicoRecente && (historicoRecente.recorrencia.length > 0 || historicoRecente.outrasQueixas.length > 0) ? (
        <Card titulo="Histórico recente">
          <Lista rotulo="Recorrência" itens={historicoRecente.recorrencia} />
          <Lista rotulo="Outras queixas recentes" itens={historicoRecente.outrasQueixas} />
        </Card>
      ) : null}
    </>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <View style={styles.linha}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

function Lista({ rotulo, itens }: { rotulo: string; itens: string[] }) {
  if (itens.length === 0) return null;
  return (
    <View style={styles.linha}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      {itens.map((i) => (
        <Text key={i} style={styles.valor}>
          • {i}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { gap: 2 },
  relato: { gap: 2, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.greenLight },
  rotulo: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight, textTransform: 'uppercase' },
  valor: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 20 },
  vazio: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  linhaSelo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selo: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.xl },
  seloTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.xs },
  data: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight },
  sintomas: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.greenDark },
});
