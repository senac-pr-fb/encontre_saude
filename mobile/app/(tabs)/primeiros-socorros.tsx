import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { ICONES_SOCORRO } from '@domain/entities/Conteudo';
import { DICAS_RAPIDAS, PRIMEIROS_SOCORROS } from '@data/static/primeirosSocorros';
import { Screen, Subtitle, Title } from '@presentation/components/ui';
import { Acordeao } from '@presentation/components/features/conteudo/Acordeao';
import { Blocos } from '@presentation/components/features/conteudo/Blocos';
import { Emergencias } from '@presentation/components/features/conteudo/Emergencias';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

const sorteia = () => Math.floor(Math.random() * DICAS_RAPIDAS.length);

export default function PrimeirosSocorrosScreen() {
  // Mesma dica rotativa do site (dicas.js), que troca a cada 10 segundos.
  const [indice, setIndice] = useState(sorteia);
  useEffect(() => {
    const id = setInterval(() => setIndice(sorteia), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <Screen>
      <Title>Primeiros Socorros</Title>
      <Subtitle>Orientações rápidas para situações de emergência.</Subtitle>

      <Emergencias />

      <View style={styles.dica}>
        <FontAwesome6 name="lightbulb" size={16} color={colors.greenDark} />
        <View style={styles.dicaTextos}>
          <Text style={styles.dicaTitulo}>Você sabia?</Text>
          <Text style={styles.dicaTexto}>{DICAS_RAPIDAS[indice]}</Text>
        </View>
      </View>

      {PRIMEIROS_SOCORROS.map((topico) => (
        <Acordeao key={topico.id} titulo={topico.titulo} icone={ICONES_SOCORRO[topico.id] ?? 'kit-medical'}>
          <Blocos blocos={topico.blocos} />
        </Acordeao>
      ))}

      <Text style={styles.aviso}>
        Este conteúdo é informativo e não substitui atendimento profissional. Em emergência, ligue 192.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dica: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.greenAccent,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  dicaTextos: { flex: 1, gap: 2 },
  dicaTitulo: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.greenDark },
  dicaTexto: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 20 },
  aviso: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
