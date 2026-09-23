import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { LIMITE_RELATO } from '@domain/usecases/triagem';
import { Body, Button, Card, ErrorMessage, Input, Screen, Subtitle, Title } from '@presentation/components/ui';
import { ResultadoTriagem } from '@presentation/components/features/triagem/ResultadoTriagem';
import { LegendaUrgencia } from '@presentation/components/features/triagem/LegendaUrgencia';
import { AvisoMedico, ChamarSamu } from '@presentation/components/features/triagem/AvisoMedico';
import { HistoricoTriagem } from '@presentation/components/features/triagem/HistoricoTriagem';
import { useTriagem } from '@presentation/hooks/useTriagem';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

export default function HomeScreen() {
  const [relato, setRelato] = useState('');
  const { analisar, historico, carregandoHistorico } = useTriagem();
  const resultado = analisar.data ?? null;

  return (
    <Screen>
      <Title>Triagem de sintomas</Title>
      <Subtitle>Descreva o que você está sentindo e receba uma orientação inicial.</Subtitle>

      <AvisoMedico />

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

        <ErrorMessage message={analisar.error?.message} />

        <Button
          title={resultado ? 'Analisar novamente' : 'Analisar sintomas'}
          onPress={() => analisar.mutate(relato)}
          loading={analisar.isPending}
          disabled={relato.trim().length < 10}
        />
        {analisar.isPending ? <Body style={styles.analisando}>Analisando seus sintomas...</Body> : null}
      </Card>

      {resultado ? (
        <>
          {/* Nível 5 é risco de vida: o atalho de ligação vem antes do texto. */}
          {resultado.nivel === 5 ? <ChamarSamu /> : null}
          <ResultadoTriagem triagem={resultado} />
          <Link href="/pre-prontuario" asChild>
            <Button title="Gerar pré-prontuário com esta triagem" variant="secondary" />
          </Link>
          <View style={styles.dica}>
            <FontAwesome6 name="circle-info" size={11} color={colors.textLight} />
            <Text style={styles.dicaTexto}>
              A queixa já vem preenchida com este resultado se você abrir o pré-prontuário nos próximos 20 minutos.
            </Text>
          </View>
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
