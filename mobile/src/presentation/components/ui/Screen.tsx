import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@presentation/theme';

interface Props extends PropsWithChildren {
  scroll?: boolean;
}

/** Container padrão de tela: fundo, safe area e padding do site. */
export function Screen({ children, scroll = true }: Props) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Body style={styles.body} contentContainerStyle={scroll ? styles.content : undefined}>
        {children}
      </Body>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
});
