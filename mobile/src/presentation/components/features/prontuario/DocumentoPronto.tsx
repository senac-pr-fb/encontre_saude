import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Body, Button, Card, ErrorMessage, SuccessMessage, Title } from '@presentation/components/ui';
import { ehExpoGo } from '@core/config/ambiente';
import { colors, fontSizes } from '@presentation/theme';

interface Props {
  onImprimir: () => Promise<void>;
  onCompartilhar: () => Promise<void>;
  onVoltar: () => void;
}

const FALHA_ARQUIVO = 'Não foi possível abrir o arquivo. Tente "Salvar ou imprimir PDF".';

/** Concluído: o PDF já existe e a consulta está no histórico. */
export function DocumentoPronto({ onImprimir, onCompartilhar, onVoltar }: Props) {
  const [erro, setErro] = useState<string | null>(null);

  // Sem o catch, uma falha aqui viraria rejeição não capturada em vez de mensagem.
  // O texto do expo-print/expo-sharing não vai para a tela (regra 14 do CLAUDE.md).
  const executar = async (acao: () => Promise<void>) => {
    setErro(null);
    try {
      await acao();
    } catch (e) {
      if (__DEV__) console.log('[pdf] falha ao abrir o arquivo:', e);
      setErro(FALHA_ARQUIVO);
    }
  };

  return (
    <>
      <Title>Pronto</Title>
      <SuccessMessage message="Pré-prontuário gerado e salvo no seu histórico." />
      <Card>
        <Body>
          Leve o documento à unidade de saúde. Você pode salvá-lo no aparelho, imprimir ou enviar por e-mail e
          WhatsApp.
        </Body>
        <ErrorMessage message={erro} />

        {/* Ação principal: o diálogo de impressão não passa pelo sistema de
            arquivos, então funciona tanto no Expo Go quanto num build. */}
        <Button title="Salvar ou imprimir PDF" onPress={() => executar(onImprimir)} />
        <Button title="Compartilhar arquivo" variant="secondary" onPress={() => executar(onCompartilhar)} />
        {ehExpoGo ? (
          <Body style={styles.nota}>
            O compartilhamento direto não funciona no Expo Go, que impede a leitura do arquivo. No app instalado
            ele funciona normalmente — até lá, use &quot;Salvar ou imprimir&quot;.
          </Body>
        ) : null}

        <Button title="Voltar ao início" variant="ghost" onPress={onVoltar} />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  nota: { fontSize: fontSizes.xs, color: colors.textLight },
});
