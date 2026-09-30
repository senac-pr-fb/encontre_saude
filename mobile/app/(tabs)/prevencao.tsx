import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { container } from '@core/di/container';
import { Screen, Subtitle } from '@presentation/components/ui';
import { CabecalhoAba } from '@presentation/components/features/navegacao/CabecalhoAba';
import { Acordeao } from '@presentation/components/features/conteudo/Acordeao';
import { colors, fonts, fontSizes, radius } from '@presentation/theme';

export default function PrevencaoScreen() {
  return (
    <Screen>
      <CabecalhoAba titulo="Ações Preventivas" />
      <Subtitle>Hábitos e sinais de alerta para cuidar da saúde antes de adoecer.</Subtitle>

      {container.conteudo.prevencao.map((topico) => (
        <Acordeao key={topico.id} titulo={topico.titulo} icone="shield-heart">
          {topico.imagem ? <Capa uri={topico.imagem} /> : null}
          {topico.paragrafos.map((p, i) => (
            <Text key={i} style={styles.paragrafo}>
              {p}
            </Text>
          ))}
        </Acordeao>
      ))}
    </Screen>
  );
}

/** As imagens sao links externos do site; se falharem, o card segue sem elas. */
function Capa({ uri }: { uri: string }) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return null;
  return (
    <View style={styles.capaBox}>
      <Image source={{ uri }} style={styles.capa} resizeMode="cover" onError={() => setFalhou(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  capaBox: { borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.grayLight },
  capa: { width: '100%', height: 160 },
  paragrafo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 21 },
});
