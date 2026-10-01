import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import type { AnaliseTriagem, RespostaTriagem } from '@domain/entities/Triagem';
import { LIMITE_RELATO } from '@domain/usecases/triagem';
import { sugestoesParaFicha } from '@domain/usecases/perfil';
import { contextoParaFormulario } from '@domain/usecases/prontuario';
import { Body, Button, Card, ErrorMessage, Input, Screen, Subtitle, SuccessMessage } from '@presentation/components/ui';
import { CabecalhoAba } from '@presentation/components/features/navegacao/CabecalhoAba';
import { ResultadoTriagem } from '@presentation/components/features/triagem/ResultadoTriagem';
import { LegendaUrgencia } from '@presentation/components/features/triagem/LegendaUrgencia';
import { AvisoMedico, ChamarSamu } from '@presentation/components/features/triagem/AvisoMedico';
import { HistoricoTriagem } from '@presentation/components/features/triagem/HistoricoTriagem';
import { PerguntasTriagem } from '@presentation/components/features/triagem/PerguntasTriagem';
import { SugestaoFicha } from '@presentation/components/features/triagem/SugestaoFicha';
import { CamposObrigatorios } from '@presentation/components/features/prontuario/CamposObrigatorios';
import { useTriagem } from '@presentation/hooks/useTriagem';
import { useContextoSaude } from '@presentation/hooks/useContextoSaude';
import { useAtualizarFichaClinica } from '@presentation/hooks/useAtualizarFichaClinica';
import { useCompletarObrigatorios } from '@presentation/hooks/useCompletarObrigatorios';
import { useTelaProtegida } from '@presentation/hooks/useTelaProtegida';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

/**
 * Pré-triagem. Depois da orientação, a conversa continua: a IA pode fazer
 * perguntas, sugerir atualizações da ficha (só gravadas se confirmadas) e os
 * obrigatórios do documento são pedidos em campos próprios, sem passar pela IA.
 */
export default function HomeScreen() {
  // `?completar=1`: veio do perfil para atualizar a ficha.
  const { completar } = useLocalSearchParams<{ completar?: string }>();
  const [relato, setRelato] = useState('');
  // A análise fica guardada aqui para continuar na tela enquanto a segunda rodada roda.
  const [analise, setAnalise] = useState<AnaliseTriagem | null>(null);
  const [relatoAnalisado, setRelatoAnalisado] = useState('');
  const [perguntasEncerradas, setPerguntasEncerradas] = useState(false);
  const [sugestaoDispensada, setSugestaoDispensada] = useState(false);

  const { analisar, historico, carregandoHistorico } = useTriagem();
  const { contexto } = useContextoSaude();
  const atualizarFicha = useAtualizarFichaClinica();
  const completarDados = useCompletarObrigatorios();
  // Relato de sintomas e histórico de triagens também são dados de saúde.
  useTelaProtegida('triagem');

  const segundaRodada = !!analisar.variables?.complemento;
  const resultado = analise?.triagem ?? null;
  const perguntasVisiveis = !!analise && analise.perguntas.length > 0 && !perguntasEncerradas;
  const sugestoes = analise && contexto ? sugestoesParaFicha(analise.atualizacoes, contexto.perfil) : {};
  const faltantes = contexto?.faltantes ?? [];
  const pedirObrigatorios = faltantes.length > 0 && (completar === '1' || (!!resultado && !perguntasVisiveis));

  const analisarRelato = () => {
    setPerguntasEncerradas(false);
    setSugestaoDispensada(false);
    atualizarFicha.reset();
    const descricao = relato.trim();
    analisar.mutate(
      { descricao },
      {
        onSuccess: (a) => {
          setAnalise(a);
          setRelatoAnalisado(descricao);
        },
      },
    );
  };

  const enviarRespostas = (respostas: RespostaTriagem[]) =>
    analisar.mutate(
      { descricao: relatoAnalisado, complemento: { respostas, historicoId: analise?.historicoId ?? null } },
      {
        onSuccess: (a) => {
          setAnalise(a);
          setPerguntasEncerradas(true);
        },
      },
    );

  const camposObrigatorios =
    pedirObrigatorios && contexto ? (
      <CamposObrigatorios
        faltantes={faltantes}
        valoresIniciais={contextoParaFormulario(contexto.perfil, contexto.nome)}
        onSalvar={(dados) => completarDados.mutate(dados)}
        salvando={completarDados.isPending}
        erro={completarDados.error?.message}
      />
    ) : null;

  return (
    <Screen>
      <CabecalhoAba titulo="Triagem de sintomas" />
      <Subtitle>Descreva o que você está sentindo e receba uma orientação inicial.</Subtitle>

      <AvisoMedico />

      {/* Vindo do perfil, o que falta na ficha aparece antes de tudo. */}
      {completar === '1' && !resultado ? camposObrigatorios : null}

      <Card>
        <Input
          label="O que você está sentindo?"
          placeholder="Onde dói, há quanto tempo, com que intensidade..."
          value={relato}
          onChangeText={setRelato}
          multiline
          numberOfLines={5}
          maxLength={LIMITE_RELATO}
          style={styles.campo}
        />
        <Text style={styles.contador}>
          {relato.length}/{LIMITE_RELATO}
        </Text>

        <ErrorMessage message={segundaRodada ? null : analisar.error?.message} />

        <Button
          title={resultado ? 'Analisar novamente' : 'Analisar sintomas'}
          onPress={analisarRelato}
          loading={analisar.isPending && !segundaRodada}
          disabled={relato.trim().length < 10 || analisar.isPending}
        />
        {analisar.isPending ? <Body style={styles.analisando}>Analisando seus sintomas...</Body> : null}
      </Card>

      {resultado ? (
        <>
          {/* Nível 5 é risco de vida: o atalho de ligação vem antes do texto. */}
          {resultado.nivel === 5 ? <ChamarSamu /> : null}
          <ResultadoTriagem triagem={resultado} />

          {perguntasVisiveis ? (
            <PerguntasTriagem
              key={analise!.historicoId ?? relatoAnalisado}
              perguntas={analise!.perguntas}
              onEnviar={enviarRespostas}
              onPular={() => setPerguntasEncerradas(true)}
              enviando={analisar.isPending && segundaRodada}
              erro={segundaRodada ? analisar.error?.message : null}
            />
          ) : (
            <>
              {Object.keys(sugestoes).length > 0 && !sugestaoDispensada ? (
                <SugestaoFicha
                  sugestoes={sugestoes}
                  onSalvar={() => atualizarFicha.mutate(sugestoes)}
                  onDispensar={() => setSugestaoDispensada(true)}
                  salvando={atualizarFicha.isPending}
                  erro={atualizarFicha.error?.message}
                />
              ) : null}
              {atualizarFicha.isSuccess ? <SuccessMessage message="Ficha de saúde atualizada." /> : null}

              {camposObrigatorios}

              <Link href="/documento" asChild>
                <Button title="Gerar pré-prontuário" variant="secondary" />
              </Link>
              <View style={styles.dica}>
                <FontAwesome6 name="circle-info" size={11} color={colors.textLight} />
                <Text style={styles.dicaTexto}>
                  Esta triagem vira a queixa do seu pré-prontuário pelas próximas 24 horas — também pelo botão do meio.
                </Text>
              </View>
            </>
          )}
        </>
      ) : null}

      <LegendaUrgencia />
      <HistoricoTriagem interacoes={historico} carregando={carregandoHistorico} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  campo: { minHeight: 120, textAlignVertical: 'top' },
  contador: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textLight, textAlign: 'right' },
  analisando: { fontSize: fontSizes.xs, color: colors.textLight, textAlign: 'center' },
  dica: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  dicaTexto: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textLight, lineHeight: 16 },
});
