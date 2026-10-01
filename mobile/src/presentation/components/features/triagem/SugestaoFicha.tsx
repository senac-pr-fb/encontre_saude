import { StyleSheet, Text, View } from 'react-native';
import type { AtualizacoesFicha } from '@domain/entities/Triagem';
import { ROTULOS_ATUALIZACOES } from '@domain/usecases/perfil';
import { Body, Button, Card, ErrorMessage } from '@presentation/components/ui';
import { colors, fonts, fontSizes } from '@presentation/theme';

interface Props {
  sugestoes: Partial<AtualizacoesFicha>;
  onSalvar: () => void;
  onDispensar: () => void;
  salvando: boolean;
  erro?: string | null;
}

/** O que a pessoa contou na conversa e ainda não está na ficha. Só grava se ela confirmar. */
export function SugestaoFicha({ sugestoes, onSalvar, onDispensar, salvando, erro }: Props) {
  const itens = Object.entries(sugestoes) as [keyof AtualizacoesFicha, string][];

  return (
    <Card titulo="Atualizar sua ficha?">
      <Body style={styles.intro}>Pelo que você contou, sua ficha de saúde ficaria assim:</Body>
      {itens.map(([campo, valor]) => (
        <View key={campo} style={styles.linha}>
          <Text style={styles.rotulo}>{ROTULOS_ATUALIZACOES[campo]}</Text>
          <Text style={styles.valor}>{valor}</Text>
        </View>
      ))}
      <ErrorMessage message={erro} />
      <Button title="Salvar na ficha" onPress={onSalvar} loading={salvando} />
      <Button title="Agora não" variant="ghost" onPress={onDispensar} disabled={salvando} />
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSizes.sm, color: colors.textLight },
  linha: { gap: 2 },
  rotulo: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight, textTransform: 'uppercase' },
  valor: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text },
});
