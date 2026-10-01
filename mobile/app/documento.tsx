import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ROTULOS_CAMPOS_OBRIGATORIOS } from '@domain/entities/ContextoSaude';
import { Body, Button, Card, ErrorMessage, Screen, Subtitle } from '@presentation/components/ui';
import { ProntuarioForm } from '@presentation/components/features/prontuario/ProntuarioForm';
import { PreviaDocumento } from '@presentation/components/features/prontuario/PreviaDocumento';
import { DocumentoPronto } from '@presentation/components/features/prontuario/DocumentoPronto';
import { AvisoProntuario } from '@presentation/components/features/prontuario/AvisoProntuario';
import { useDocumento } from '@presentation/hooks/useDocumento';
import { useTelaProtegida } from '@presentation/hooks/useTelaProtegida';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

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
    iniciaisEdicao,
    rascunhoRestaurado,
    gerarDoContexto,
    salvarRascunho,
    concluir,
    compartilhar,
    imprimir,
  } = useDocumento();
  const [editando, setEditando] = useState(false);
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

        <ProntuarioForm
          valoresIniciais={iniciaisEdicao}
          onRascunho={salvarRascunho}
          onConcluir={(valores) => concluir.mutate(valores)}
          gerando={concluir.isPending}
          erro={concluir.error?.message}
        />
        <Button title="Cancelar edição" variant="ghost" onPress={() => setEditando(false)} />
      </Screen>
    );
  }

  const { situacao, faltantes, ultimaTriagem } = contexto;

  return (
    <Screen>
      <ErrorMessage message={erro} />

      {situacao === 'pronto' ? (
        <>
          <Subtitle>Confira antes de gerar. O documento usa sua última pré-triagem e sua ficha de saúde.</Subtitle>
          <PreviaDocumento contexto={contexto} />
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
        <>
          <Card titulo="Faltam alguns dados">
            <Body>Para gerar o documento, complete:</Body>
            {faltantes.map((c) => (
              <Text key={c} style={styles.item}>
                • {ROTULOS_CAMPOS_OBRIGATORIOS[c]}
              </Text>
            ))}
            <Body style={styles.nota}>Eles ficam salvos na sua ficha e não serão pedidos de novo.</Body>
          </Card>
          <Button title="Completar dados" onPress={() => setEditando(true)} />
        </>
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
  item: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.text },
  nota: { fontSize: fontSizes.xs, color: colors.textLight },
});
