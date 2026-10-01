import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Card, ErrorMessage, Screen, Subtitle } from '@presentation/components/ui';
import { ProntuarioForm } from '@presentation/components/features/prontuario/ProntuarioForm';
import { PreviaDocumento } from '@presentation/components/features/prontuario/PreviaDocumento';
import { DocumentoPronto } from '@presentation/components/features/prontuario/DocumentoPronto';
import { CamposObrigatorios } from '@presentation/components/features/prontuario/CamposObrigatorios';
import { EscolhaEpisodio } from '@presentation/components/features/prontuario/EscolhaEpisodio';
import { AvisoProntuario } from '@presentation/components/features/prontuario/AvisoProntuario';
import { useDocumento } from '@presentation/hooks/useDocumento';
import { useTelaProtegida } from '@presentation/hooks/useTelaProtegida';
import { colors, spacing } from '@presentation/theme';

/**
 * Destino do botão do meio. Não faz triagem: gera o documento a partir do
 * contexto de saúde ou diz o que falta. A edição manual é opcional.
 */
export default function DocumentoScreen() {
  const router = useRouter();
  const {
    contexto,
    carregando,
    erro,
    episodio,
    escolherEpisodio,
    historicoRecente,
    iniciaisEdicao,
    rascunhoRestaurado,
    dadosPessoaisOk,
    gerarDoContexto,
    concluirEdicao,
    salvarRascunho,
    concluir,
    completar,
    compartilhar,
    imprimir,
  } = useDocumento();
  // O perfil abre direto na edição (`?modo=editar`): é o pré-prontuário manual.
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const [editando, setEditando] = useState(modo === 'editar');
  const [precisaAjuste, setPrecisaAjuste] = useState(false);
  useTelaProtegida('documento');

  const irParaTriagem = () => router.replace('/(tabs)');

  if (concluir.isSuccess) {
    return (
      <Screen>
        <DocumentoPronto
          onImprimir={() => imprimir(concluir.data.prontuario)}
          onCompartilhar={() => compartilhar(concluir.data.pdf.uri)}
          onVoltar={irParaTriagem}
        />
      </Screen>
    );
  }

  if (carregando || !contexto || !iniciaisEdicao) {
    return (
      <Screen>
        <ErrorMessage message={erro} />
        <ActivityIndicator color={colors.greenMedium} style={styles.centro} />
      </Screen>
    );
  }

  const { situacao, faltantes, ultimaTriagem } = contexto;

  if (editando) {
    return (
      <Screen>
        <Subtitle>Ajuste o que precisar. O que você mudar também atualiza sua ficha de saúde.</Subtitle>
        {precisaAjuste ? (
          <AvisoProntuario icone="triangle-exclamation" texto="Alguns dados da ficha precisam de ajuste antes de gerar." />
        ) : null}
        {rascunhoRestaurado ? (
          <AvisoProntuario icone="floppy-disk" texto="Recuperamos o que você havia preenchido antes." />
        ) : null}

        {/* Primeiro só o que falta na ficha; salvo, o formulário abre já nos sintomas. */}
        {faltantes.length > 0 ? (
          <CamposObrigatorios
            faltantes={faltantes}
            valoresIniciais={iniciaisEdicao}
            onSalvar={(dados) => completar.mutate(dados)}
            salvando={completar.isPending}
            erro={completar.error?.message}
          />
        ) : (
          <ProntuarioForm
            valoresIniciais={iniciaisEdicao}
            onRascunho={salvarRascunho}
            onConcluir={concluirEdicao}
            gerando={concluir.isPending}
            erro={concluir.error?.message}
            pularDadosPessoais={dadosPessoaisOk}
          />
        )}
        <Button title="Cancelar edição" variant="ghost" onPress={() => setEditando(false)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ErrorMessage message={erro} />

      {situacao === 'pronto' ? (
        <>
          <Subtitle>Confira antes de gerar. O documento usa sua última pré-triagem e sua ficha de saúde.</Subtitle>
          {contexto.episodiosAtivos.length > 1 ? (
            <EscolhaEpisodio
              episodios={contexto.episodiosAtivos}
              selecionado={episodio?.id ?? null}
              onEscolher={escolherEpisodio}
            />
          ) : null}
          <PreviaDocumento contexto={contexto} episodio={episodio} historicoRecente={historicoRecente} />
          <ErrorMessage message={concluir.error?.message} />
          <Button
            title="Gerar PDF"
            loading={concluir.isPending}
            onPress={() => {
              // Dado da ficha fora das regras do documento: corrige no formulário.
              if (!gerarDoContexto()) {
                setPrecisaAjuste(true);
                setEditando(true);
              }
            }}
          />
          <Button
            title="Editar antes de gerar"
            variant="secondary"
            disabled={concluir.isPending}
            onPress={() => setEditando(true)}
          />
        </>
      ) : null}

      {situacao === 'dados-faltando' ? (
        <CamposObrigatorios
          faltantes={faltantes}
          valoresIniciais={iniciaisEdicao}
          onSalvar={(dados) => completar.mutate(dados)}
          salvando={completar.isPending}
          erro={completar.error?.message}
        />
      ) : null}

      {situacao === 'sem-triagem' || situacao === 'triagem-vencida' ? (
        <>
          <Card>
            <Body>
              {situacao === 'triagem-vencida' && ultimaTriagem
                ? `Sua última pré-triagem foi em ${new Date(ultimaTriagem.quando).toLocaleDateString('pt-BR')}. ` +
                  'Para o documento refletir o que você sente agora, faça uma nova.'
                : 'Conte o que está sentindo na pré-triagem: a queixa e os sintomas do documento saem dela.'}
            </Body>
          </Card>
          <Button title="Fazer pré-triagem" onPress={irParaTriagem} />
          <Button title="Preencher manualmente" variant="secondary" onPress={() => setEditando(true)} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centro: { marginTop: spacing.xl },
});
