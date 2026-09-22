import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}

const textColor: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.greenDark,
  ghost: colors.greenDark,
  danger: colors.white,
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant === 'primary' && { backgroundColor: colors.btnActive },
        pressed && variant !== 'primary' && { opacity: 0.8 },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, { color: textColor[variant] }]}>{title}</Text>
        </View>
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
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: { backgroundColor: colors.greenMedium },
  secondary: { backgroundColor: colors.greenAccent, borderWidth: 1, borderColor: colors.greenLight },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
  disabled: { opacity: 0.6 },
  text: { fontFamily: fonts.semibold, fontSize: fontSizes.md },
});
