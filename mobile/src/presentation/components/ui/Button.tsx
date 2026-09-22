import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant === 'primary' && { backgroundColor: colors.btnActive },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.greenDark} />
      ) : (
        <Text style={[styles.text, variant !== 'primary' && { color: colors.greenDark }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: { backgroundColor: colors.greenMedium },
  secondary: { backgroundColor: colors.greenAccent, borderWidth: 1, borderColor: colors.greenLight },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.6 },
  text: { color: colors.white, fontFamily: fonts.semibold, fontSize: fontSizes.md },
});
