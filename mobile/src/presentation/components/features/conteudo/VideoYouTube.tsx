import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  /** Id do vídeo no YouTube (ex.: C2c0BIJygYI). */
  id: string;
}

/**
 * Player embutido, como o <iframe> do site.
 * Só monta a WebView depois do toque: nove WebViews simultâneas numa lista
 * consumiriam memória à toa, e o acordeão pode abrir vários tópicos.
 */
export function VideoYouTube({ id }: Props) {
  const [tocando, setTocando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  const abrirNoYouTube = () => Linking.openURL(`https://www.youtube.com/watch?v=${id}`);

  if (falhou) {
    return (
      <Pressable style={[styles.moldura, styles.centro]} onPress={abrirNoYouTube}>
        <FontAwesome6 name="youtube" size={28} color={colors.error} />
        <Text style={styles.aviso}>Não foi possível carregar o vídeo aqui.</Text>
        <Text style={styles.link}>Abrir no YouTube</Text>
      </Pressable>
    );
  }

  if (!tocando) {
    return (
      <Pressable
        style={[styles.moldura, styles.centro]}
        onPress={() => setTocando(true)}
        accessibilityRole="button"
        accessibilityLabel="Assistir ao vídeo demonstrativo"
      >
        <FontAwesome6 name="circle-play" size={36} color={colors.white} />
        <Text style={styles.rotulo}>Assistir demonstração</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.moldura}>
      <WebView
        source={{ uri: `https://www.youtube.com/embed/${id}?playsinline=1&rel=0` }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centro}>
            <ActivityIndicator color={colors.white} />
          </View>
        )}
        onError={() => setFalhou(true)}
        onHttpError={() => setFalhou(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  moldura: {
    height: 200,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.blackDark,
  },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  web: { flex: 1, backgroundColor: colors.blackDark },
  rotulo: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.white },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.grayLight, textAlign: 'center' },
  link: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.white },
});
