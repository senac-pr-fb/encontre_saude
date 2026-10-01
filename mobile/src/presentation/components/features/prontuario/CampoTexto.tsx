import { StyleSheet } from 'react-native';
import { Controller, type Control, type FieldPath } from 'react-hook-form';
import type { ProntuarioFormInput, ProntuarioFormOutput } from '@domain/usecases/prontuario';
import { Input } from '@presentation/components/ui';

export type ControleProntuario = Control<ProntuarioFormInput, unknown, ProntuarioFormOutput>;

interface Props {
  control: ControleProntuario;
  name: FieldPath<ProntuarioFormInput>;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof Input>['keyboardType'];
  multiline?: boolean;
  mascara?: (v: string) => string;
}

/** Campo de texto do pré-prontuário ligado ao react-hook-form, com máscara opcional. */
export function CampoTexto({ control, name, label, mascara, multiline, ...rest }: Props) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          label={label}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={(t) => field.onChange(mascara ? mascara(t) : t)}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          multiline={multiline}
          numberOfLines={multiline ? 3 : undefined}
          style={multiline ? styles.multiline : undefined}
          {...rest}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});
