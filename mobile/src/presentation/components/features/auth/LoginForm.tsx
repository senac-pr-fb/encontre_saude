import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@domain/usecases/auth';
import { Button, ErrorMessage, Input, PasswordInput, TextLink } from '@presentation/components/ui';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';
import { BotaoGoogle } from './BotaoGoogle';

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

      <View style={styles.divisor}>
        <View style={styles.linha} />
        <Text style={styles.ou}>ou</Text>
        <View style={styles.linha} />
      </View>

      <BotaoGoogle onPress={onGoogle} carregando={carregandoGoogle} desabilitado={carregando} />
      <TextLink onPress={onCadastro}>Não tem conta? Cadastre-se</TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs },
  linha: { flex: 1, height: 1, backgroundColor: colors.grayLight },
  ou: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.textLight },
});
