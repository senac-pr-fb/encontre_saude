import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Body, Button, Card, ErrorMessage, Screen, Subtitle, SuccessMessage, Title } from '@presentation/components/ui';
import { ProntuarioForm } from '@presentation/components/features/prontuario/ProntuarioForm';
import { usePreProntuario } from '@presentation/hooks/usePreProntuario';
import { ehExpoGo } from '@core/config/ambiente';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

export default function PreProntuarioScreen() {
  const router = useRouter();
  const { iniciais, triagem, rascunhoRestaurado, salvarRascunho, concluir, compartilhar, imprimir } =
    usePreProntuario();
  const [erroCompartilhar, setErroCompartilhar] = useState<string | null>(null);

  // Sem o catch, uma falha aqui viraria rejeição não capturada em vez de mensagem.
  const executar = async (acao: () => Promise<void>) => {
    setErroCompartilhar(null);
    try {
      await acao();
    } catch (e) {
      setErroCompartilhar(e instanceof Error ? e.message : 'Não foi possível abrir o arquivo.');
    }
  };

  if (!iniciais) {
    return (
      <Screen>
        <ActivityIndicator color={colors.greenMedium} style={styles.centro} />
      </Screen>
    );
  }

  // Concluído: o PDF já existe e a consulta está no histórico.
  if (concluir.isSuccess) {
    return (
      <Screen>
        <Title>Pronto</Title>
        <SuccessMessage message="Pré-prontuário gerado e salvo no seu histórico." />
        <Card>
          <Body>
            Leve o documento à unidade de saúde. Você pode salvá-lo no aparelho, imprimir ou enviar por e-mail e
            WhatsApp.
          </Body>
          <ErrorMessage message={erroCompartilhar} />

          {/* Ação principal: o diálogo de impressão não passa pelo sistema de
              arquivos, então funciona tanto no Expo Go quanto num build. */}
          <Button
            title="Salvar ou imprimir PDF"
            onPress={() => executar(() => imprimir(concluir.data.prontuario))}
          />
          <Button
            title="Compartilhar arquivo"
            variant="secondary"
            onPress={() => executar(() => compartilhar(concluir.data.pdf.uri))}
          />
          {ehExpoGo ? (
            <Body style={styles.nota}>
              O compartilhamento direto não funciona no Expo Go, que impede a leitura do arquivo. No app instalado
              ele funciona normalmente — até lá, use &quot;Salvar ou imprimir&quot;.
            </Body>
          ) : null}

          <Button title="Voltar ao início" variant="ghost" onPress={() => router.replace('/(tabs)')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Pré-prontuário</Title>
      <Subtitle>Preencha antes de ir à unidade de saúde: o atendimento começa com tudo em mãos.</Subtitle>

      {triagem ? (
        <Aviso icone="robot" texto="Sua última triagem foi usada para preencher a queixa principal." />
      ) : null}
      {rascunhoRestaurado ? (
        <Aviso icone="floppy-disk" texto="Recuperamos o que você havia preenchido antes." />
      ) : null}

      <ProntuarioForm
        valoresIniciais={iniciais}
        onRascunho={salvarRascunho}
        onConcluir={(valores) => concluir.mutate(valores)}
        gerando={concluir.isPending}
        erro={concluir.error?.message}
      />
    </Screen>
  );
}

function Aviso({ icone, texto }: { icone: string; texto: string }) {
  return (
    <View style={styles.aviso}>
      <FontAwesome6 name={icone} size={13} color={colors.greenDark} />
      <Body style={styles.avisoTexto}>{texto}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { marginTop: spacing.xl },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenAccent,
    padding: spacing.sm,
    borderRadius: 8,
  },
  avisoTexto: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.greenDark },
  nota: { fontSize: fontSizes.xs, color: colors.textLight },
});
