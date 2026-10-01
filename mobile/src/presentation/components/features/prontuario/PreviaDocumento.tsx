import { StyleSheet, Text, View } from 'react-native';
import type { ContextoSaude } from '@domain/entities/ContextoSaude';
import { NIVEIS } from '@domain/entities/Triagem';
import { rotuloDoSintoma } from '@domain/entities/PreProntuario';
import { Card } from '@presentation/components/ui';
import { textoSobreNivel } from '@presentation/components/features/triagem/ResultadoTriagem';
import { dataParaBR, mascararCPF, mascararTelefone } from '@core/utils/formato';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

/** O que vai no PDF, lido do contexto de saúde, para conferir antes de gerar. */
export function PreviaDocumento({ contexto }: { contexto: ContextoSaude }) {
  const { perfil, nome, ultimaTriagem } = contexto;
  const triagem = ultimaTriagem?.triagem;
  const nivel = triagem ? NIVEIS[triagem.nivel] : null;
  const clinico = [
    ['Alergias', perfil.alergias],
    ['Medicamentos em uso', perfil.medicamentosEmUso],
    ['Doenças preexistentes', perfil.doencasPreexistentes],
  ] as const;

  return (
    <>
      {ultimaTriagem && triagem && nivel ? (
        <Card titulo="Queixa">
          <View style={styles.linhaSelo}>
            <View style={[styles.selo, { backgroundColor: nivel.cor }]}>
              <Text style={[styles.seloTexto, { color: textoSobreNivel(triagem.nivel) }]}>
                Nível {triagem.nivel} · {nivel.texto}
              </Text>
            </View>
            <Text style={styles.data}>{formatarQuando(ultimaTriagem.quando)}</Text>
          </View>
          <Text style={styles.valor}>{ultimaTriagem.descricao}</Text>
          {triagem.sintomas.length > 0 ? (
            <Text style={styles.sintomas}>{triagem.sintomas.map(rotuloDoSintoma).join(' · ')}</Text>
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

const formatarQuando = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const styles = StyleSheet.create({
  linha: { gap: 2 },
  rotulo: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight, textTransform: 'uppercase' },
  valor: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 20 },
  vazio: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  linhaSelo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selo: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.xl },
  seloTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.xs },
  data: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight },
  sintomas: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.greenDark },
});
