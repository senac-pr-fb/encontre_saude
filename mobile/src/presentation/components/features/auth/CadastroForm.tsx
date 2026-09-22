import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cadastroSchema, type CadastroInput } from '@domain/usecases/auth';
import { Button, ErrorMessage, Input, PasswordInput, TextLink } from '@presentation/components/ui';
import { spacing } from '@presentation/theme';

interface Props {
  onSubmit: (input: CadastroInput) => void;
  onLogin: () => void;
  carregando: boolean;
  erro?: string | null;
}

export function CadastroForm({ onSubmit, onLogin, carregando, erro }: Props) {
  const senhaRef = useRef<TextInput>(null);
  const confirmarRef = useRef<TextInput>(null);
  const { control, handleSubmit } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { email: '', senha: '', confirmarSenha: '' },
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
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmarRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmarSenha"
        render={({ field, fieldState }) => (
          <PasswordInput
            ref={confirmarRef}
            label="Confirmar senha"
            placeholder="Repita a senha"
            autoComplete="new-password"
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

      <Button title="Criar conta" onPress={handleSubmit(onSubmit)} loading={carregando} />
      <TextLink onPress={onLogin}>Já tem conta? Entrar</TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
