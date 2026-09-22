import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recuperarSenhaSchema, type RecuperarSenhaInput } from '@domain/usecases/auth';
import { Body, Button, ErrorMessage, Input, SuccessMessage, TextLink } from '@presentation/components/ui';
import { spacing } from '@presentation/theme';

interface Props {
  onSubmit: (input: RecuperarSenhaInput) => void;
  onVoltar: () => void;
  carregando: boolean;
  enviado: boolean;
  erro?: string | null;
}

/**
 * Visita 1 do fluxo de recuperação (igual ao site): pede o e-mail e envia o link.
 * A visita 2 (nova senha) acontece em app/nova-senha.tsx, aberta pelo link.
 */
export function RecuperarSenhaForm({ onSubmit, onVoltar, carregando, enviado, erro }: Props) {
  const { control, handleSubmit } = useForm<RecuperarSenhaInput>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: '' },
  });

  if (enviado) {
    return (
      <View style={styles.form}>
        <SuccessMessage message="Enviamos um link para o seu e-mail. Abra-o neste aparelho para definir a nova senha." />
        <TextLink onPress={onVoltar}>Voltar para o login</TextLink>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Body>Informe o e-mail da sua conta. Você receberá um link para criar uma nova senha.</Body>
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
            returnKeyType="send"
            onSubmitEditing={handleSubmit(onSubmit)}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <ErrorMessage message={erro} />

      <Button title="Enviar link" onPress={handleSubmit(onSubmit)} loading={carregando} />
      <TextLink onPress={onVoltar}>Voltar para o login</TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
