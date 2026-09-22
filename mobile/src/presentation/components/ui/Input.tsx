import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, Props>(function Input({ label, error, style, ...rest }, ref) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.grayMedium}
        style={[styles.input, error && styles.inputError, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

/** Substitui shared/toggle_senha.js: campo de senha com botão de mostrar/ocultar. */
export const PasswordInput = forwardRef<TextInput, Props>(function PasswordInput({ label, error, style, ...rest }, ref) {
  const [visivel, setVisivel] = useState(false);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, styles.row, error && styles.inputError]}>
        <TextInput
          ref={ref}
          secureTextEntry={!visivel}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.grayMedium}
          style={[styles.inner, style]}
          {...rest}
        />
        <Pressable
          onPress={() => setVisivel((v) => !v)}
          hitSlop={8}
          accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <FontAwesome6 name={visivel ? 'eye-slash' : 'eye'} size={18} color={colors.grayMedium} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.text },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  inputError: { borderColor: colors.error },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 },
  inner: { flex: 1, paddingVertical: 12, fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.text },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.error },
});
