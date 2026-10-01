import { useState } from 'react';
import { StyleSheet } from 'react-native';
import type { PerguntaTriagem, RespostaTriagem } from '@domain/entities/Triagem';
import { LIMITE_RESPOSTA } from '@domain/usecases/triagem';
import { Body, Button, Card, ErrorMessage, Input } from '@presentation/components/ui';
import { colors, fontSizes } from '@presentation/theme';

interface Props {
  perguntas: PerguntaTriagem[];
  onEnviar: (respostas: RespostaTriagem[]) => void;
  onPular: () => void;
  enviando: boolean;
  erro?: string | null;
}

/**
 * Continuação da pré-triagem: a IA pergunta o que falta na ficha ou o que pode
 * mudar a orientação. Responder é opcional; o que for respondido refaz a análise.
 */
export function PerguntasTriagem({ perguntas, onEnviar, onPular, enviando, erro }: Props) {
  const [respostas, setRespostas] = useState<string[]>(() => perguntas.map(() => ''));
  const algumaRespondida = respostas.some((r) => r.trim() !== '');

  return (
    <Card titulo="Para orientar melhor">
      <Body style={styles.intro}>Responda o que souber. O que você disser também pode atualizar sua ficha.</Body>
      {perguntas.map((p, i) => (
        <Input
          key={`${i}-${p.pergunta}`}
          label={p.pergunta}
          value={respostas[i]}
          onChangeText={(t) => setRespostas((atual) => atual.map((r, j) => (j === i ? t : r)))}
          accessibilityLabel={p.pergunta}
          maxLength={LIMITE_RESPOSTA}
          multiline
        />
      ))}
      <ErrorMessage message={erro} />
      <Button
        title="Enviar respostas"
        onPress={() => onEnviar(perguntas.map((p, i) => ({ pergunta: p.pergunta, resposta: respostas[i] })))}
        loading={enviando}
        disabled={!algumaRespondida}
      />
      <Button title="Pular" variant="ghost" onPress={onPular} disabled={enviando} />
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSizes.sm, color: colors.textLight },
});
