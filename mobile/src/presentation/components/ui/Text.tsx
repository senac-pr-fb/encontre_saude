import { Pressable, StyleSheet, Text, TextProps } from 'react-native';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

export function Title(props: TextProps) {
  return <Text {...props} style={[styles.title, props.style]} />;
}

export function Subtitle(props: TextProps) {
  return <Text {...props} style={[styles.subtitle, props.style]} />;
}

export function Body(props: TextProps) {
  return <Text {...props} style={[styles.body, props.style]} />;
}

/** Mensagem de erro de formulário/ação. Não renderiza nada se vazio. */
export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Text style={styles.errorBox} accessibilityRole="alert">
      {message}
    </Text>
  );
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.successBox}>{message}</Text>;
}

interface LinkProps {
  children: string;
  onPress: () => void;
}

/** Link textual (ex.: "Esqueceu a senha?"). */
export function TextLink({ children, onPress }: LinkProps) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Text style={styles.link}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, color: colors.greenDark },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textLight },
  body: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.text },
  link: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.greenMedium, textAlign: 'center' },
  errorBox: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.error,
    backgroundColor: '#FFF0F0',
    padding: spacing.sm,
    borderRadius: 8,
  },
  successBox: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.greenDark,
    backgroundColor: colors.greenAccent,
    padding: spacing.sm,
    borderRadius: 8,
  },
});
