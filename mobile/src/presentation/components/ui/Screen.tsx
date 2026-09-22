import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@presentation/theme';

interface Props extends PropsWithChildren {
  scroll?: boolean;
}

/** Container padrão de tela: fundo, safe area e padding do site. */
export function Screen({ children, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  // Android edge-to-edge: a barra de navegação cobre o fim da tela. Somamos o
  // inset ao padding do conteúdo (e não à safe area) para que o último elemento
  // fique acessível e a rolagem alcance ele, sem criar espaço morto nas abas.
  const fim = { paddingBottom: spacing.md + insets.bottom };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView style={styles.body} contentContainerStyle={[styles.content, fim]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, fim]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
});
