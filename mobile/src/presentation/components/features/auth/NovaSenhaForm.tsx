import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { novaSenhaSchema, type NovaSenhaInput } from '@domain/usecases/auth';
import { Body, Button, ErrorMessage, PasswordInput } from '@presentation/components/ui';
import { spacing } from '@presentation/theme';

interface Props {
  onSubmit: (input: NovaSenhaInput) => void;
  carregando: boolean;
  erro?: string | null;
}

/** Visita 2 da recuperação de senha — o link do e-mail já restaurou a sessão. */
export function NovaSenhaForm({ onSubmit, carregando, erro }: Props) {
  const confirmarRef = useRef<TextInput>(null);
  const { control, handleSubmit } = useForm<NovaSenhaInput>({
    resolver: zodResolver(novaSenhaSchema),
    defaultValues: { senha: '', confirmarSenha: '' },
  });

  return (
    <View style={styles.form}>
      <Body>Defina a nova senha da sua conta.</Body>
      <Controller
        control={control}
        name="senha"
        render={({ field, fieldState }) => (
          <PasswordInput
            label="Nova senha"
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
            label="Confirmar nova senha"
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

      <Button title="Salvar nova senha" onPress={handleSubmit(onSubmit)} loading={carregando} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
