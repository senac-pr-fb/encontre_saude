import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  /** Id do vídeo no YouTube (ex.: C2c0BIJygYI). */
  id: string;
}

/**
 * Capa do vídeo que abre o YouTube ao toque.
 *
 * Antes isto era um player embutido numa WebView, como o <iframe> do site. Não
 * funcionou: vários destes vídeos têm reprodução restrita fora do YouTube e o
 * player respondia "Este vídeo não está disponível — erro 152". Pior, esse erro
 * é desenhado *dentro* do iframe, então o app não tinha como detectá-lo e
 * mostrar algo melhor.
 *
 * A miniatura não sofre a restrição (é uma imagem pública), e o app do YouTube
 * reproduz sem limitação. Some a WebView do bundle e o usuário ganha tela
 * cheia, controle de qualidade e legendas de verdade.
 */
export function VideoYouTube({ id }: Props) {
  const [semCapa, setSemCapa] = useState(false);
  const abrir = () => Linking.openURL(`https://www.youtube.com/watch?v=${id}`);

  return (
    <Pressable
      onPress={abrir}
      style={styles.moldura}
      accessibilityRole="button"
      accessibilityLabel="Assistir ao vídeo demonstrativo no YouTube"
    >
      {semCapa ? null : (
        <Image
          source={{ uri: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }}
          style={styles.capa}
          resizeMode="cover"
          onError={() => setSemCapa(true)}
        />
      )}

      <View style={styles.sobreposicao}>
        <View style={styles.botao}>
          <FontAwesome6 name="play" size={18} color={colors.white} />
        </View>
        <View style={styles.rodape}>
          <FontAwesome6 name="youtube" size={13} color={colors.white} />
          <Text style={styles.rotulo}>Assistir no YouTube</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  moldura: {
    height: 190,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.blackDark,
    justifyContent: 'center',
  },
  capa: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sobreposicao: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Escurece a miniatura para o botão e o rótulo terem contraste garantido.
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  botao: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  rodape: {
    position: 'absolute',
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rotulo: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.white },
});
