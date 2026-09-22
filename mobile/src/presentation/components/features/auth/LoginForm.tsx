import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { loginSchema, type LoginInput } from '@domain/usecases/auth';
import { Button, ErrorMessage, Input, PasswordInput, TextLink } from '@presentation/components/ui';
import { colors, spacing } from '@presentation/theme';

interface Props {
  onSubmit: (input: LoginInput) => void;
  onGoogle: () => void;
  onEsqueceuSenha: () => void;
  onCadastro: () => void;
  carregando: boolean;
  carregandoGoogle: boolean;
  erro?: string | null;
}

export function LoginForm({ onSubmit, onGoogle, onEsqueceuSenha, onCadastro, carregando, carregandoGoogle, erro }: Props) {
  const senhaRef = useRef<TextInput>(null);
  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label="E-mail"
            placeholder="voce@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => senhaRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="senha"
        render={({ field, fieldState }) => (
          <PasswordInput
            ref={senhaRef}
            label="Senha"
            placeholder="Sua senha"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <ErrorMessage message={erro} />

      <Button title="Entrar" onPress={handleSubmit(onSubmit)} loading={carregando} disabled={carregandoGoogle} />
      <TextLink onPress={onEsqueceuSenha}>Esqueceu a senha?</TextLink>

      <View style={styles.divider} />

      <Button
        title="Entrar com Google"
        variant="secondary"
        onPress={onGoogle}
        loading={carregandoGoogle}
        disabled={carregando}
        icon={<FontAwesome6 name="google" size={16} color={colors.greenDark} />}
      />
      <TextLink onPress={onCadastro}>Não tem conta? Cadastre-se</TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.grayLight, marginVertical: spacing.xs },
});
