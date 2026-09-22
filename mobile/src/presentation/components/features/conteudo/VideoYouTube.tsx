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
 * O embed precisa de uma origem válida: carregar a URL direto na WebView não
 * manda referer, e o YouTube responde "Video player configuration error".
 * Por isso servimos o <iframe> como HTML com `baseUrl` no domínio do YouTube.
 */
const paginaDoPlayer = (id: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
      iframe { border: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <iframe
      src="https://www.youtube.com/embed/${id}?playsinline=1&rel=0&modestbranding=1&autoplay=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </body>
</html>`;

export function VideoYouTube({ id }: Props) {
  const [tocando, setTocando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  const abrirNoYouTube = () => Linking.openURL(`https://www.youtube.com/watch?v=${id}`);

  return (
    <View style={styles.bloco}>
      {falhou ? (
        <Pressable style={[styles.moldura, styles.centro]} onPress={abrirNoYouTube}>
          <FontAwesome6 name="youtube" size={28} color={colors.error} />
          <Text style={styles.aviso}>Não foi possível carregar o vídeo aqui.</Text>
        </Pressable>
      ) : !tocando ? (
        // A WebView só nasce depois do toque: o acordeão abre vários tópicos,
        // e nove players vivos consumiriam memória à toa.
        <Pressable
          style={[styles.moldura, styles.centro]}
          onPress={() => setTocando(true)}
          accessibilityRole="button"
          accessibilityLabel="Assistir ao vídeo demonstrativo"
        >
          <FontAwesome6 name="circle-play" size={36} color={colors.white} />
          <Text style={styles.rotulo}>Assistir demonstração</Text>
        </Pressable>
      ) : (
        <View style={styles.moldura}>
          <WebView
            source={{ html: paginaDoPlayer(id), baseUrl: 'https://www.youtube.com' }}
            originWhitelist={['*']}
            style={styles.web}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.moldura, styles.centro]}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}
            onError={() => setFalhou(true)}
            onHttpError={() => setFalhou(true)}
          />
        </View>
      )}

      {/* Saída sempre disponível: o erro do YouTube aparece dentro do iframe e não dispara onError. */}
      <Pressable onPress={abrirNoYouTube} hitSlop={6} style={styles.linkLinha}>
        <FontAwesome6 name="up-right-from-square" size={11} color={colors.greenMedium} />
        <Text style={styles.link}>Abrir no YouTube</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: spacing.xs },
  moldura: {
    height: 200,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.blackDark,
  },
  centro: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  web: { flex: 1, backgroundColor: colors.blackDark },
  rotulo: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.white },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.grayLight, textAlign: 'center' },
  linkLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-end' },
  link: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.greenMedium },
});
