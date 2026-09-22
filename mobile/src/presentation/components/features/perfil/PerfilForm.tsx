import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StyleSheet, View } from 'react-native';
import { SEXOS } from '@domain/entities/PerfilSaude';
import { perfilSchema, type PerfilFormInput, type PerfilFormOutput } from '@domain/usecases/perfil';
import { Body, Button, Card, ErrorMessage, Input, Opcoes, SuccessMessage, Toggle } from '@presentation/components/ui';
import { mascararCPF, mascararData, mascararTelefone } from '@core/utils/formato';
import { spacing } from '@presentation/theme';

interface Props {
  valoresIniciais: PerfilFormInput;
  onSubmit: (valores: PerfilFormInput) => void;
  salvando: boolean;
  erro?: string | null;
  sucesso?: boolean;
}

type Campo = FieldPath<PerfilFormInput>;

export function PerfilForm({ valoresIniciais, onSubmit, salvando, erro, sucesso }: Props) {
  const { control, handleSubmit, getValues } = useForm<PerfilFormInput, unknown, PerfilFormOutput>({
    resolver: zodResolver(perfilSchema),
    defaultValues: valoresIniciais,
  });

  // O handleSubmit valida e converte para exibir os erros nos campos, mas quem
  // recebe os valores crus é o SavePerfil: a conversão definitiva é dele, com o
  // mesmo schema. Assim a regra continua no domínio, não no formulário.
  const enviar = handleSubmit(() => onSubmit(getValues()));

  return (
    <View style={styles.form}>
      <Card titulo="Dados pessoais">
        <Texto control={control} name="idade" label="Idade" keyboardType="number-pad" placeholder="Ex.: 32" />
        <Controller
          control={control}
          name="sexo"
          render={({ field, fieldState }) => (
            <Opcoes
              label="Sexo"
              opcoes={SEXOS}
              value={field.value ?? null}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Texto control={control} name="peso" label="Peso (kg)" keyboardType="decimal-pad" placeholder="Ex.: 70,5" />
        <Texto control={control} name="altura" label="Altura (m)" keyboardType="decimal-pad" placeholder="Ex.: 1,75" />
        <Texto
          control={control}
          name="cpf"
          label="CPF"
          keyboardType="number-pad"
          placeholder="000.000.000-00"
          mascara={mascararCPF}
        />
        <Texto
          control={control}
          name="dataNascimento"
          label="Data de nascimento"
          placeholder="dd/mm/aaaa"
          keyboardType="number-pad"
          mascara={mascararData}
        />
        <Texto
          control={control}
          name="telefone"
          label="Telefone"
          keyboardType="phone-pad"
          placeholder="(46) 99999-9999"
          mascara={mascararTelefone}
        />
      </Card>

      <Card titulo="Hábitos">
        <Controller
          control={control}
          name="fuma"
          render={({ field }) => <Toggle label="Fuma" value={field.value} onValueChange={field.onChange} />}
        />
        <Controller
          control={control}
          name="bebe"
          render={({ field }) => <Toggle label="Consome álcool" value={field.value} onValueChange={field.onChange} />}
        />
      </Card>

      <Card titulo="Condições de saúde">
        <Texto control={control} name="alergias" label="Alergias" placeholder="Ex.: poeira, frutos do mar" multiline />
        <Texto
          control={control}
          name="alergiaMedicamento"
          label="Alergia a medicamentos"
          placeholder="Ex.: dipirona"
          multiline
        />
        <Texto
          control={control}
          name="medicamentosEmUso"
          label="Medicamentos em uso"
          placeholder="Nome e dosagem"
          multiline
        />
        <Texto
          control={control}
          name="doencasPreexistentes"
          label="Doenças preexistentes"
          placeholder="Ex.: hipertensão"
          multiline
        />
        <Texto
          control={control}
          name="historicoFamiliar"
          label="Histórico familiar"
          placeholder="Doenças na família"
          multiline
        />
        <Texto
          control={control}
          name="possuiDeficiencia"
          label="Possui deficiência"
          placeholder="Descreva, se houver"
          multiline
        />
      </Card>

      <Card titulo="Sinais vitais">
        <Body>Preencha apenas se tiver medições recentes.</Body>
        <Texto
          control={control}
          name="sinaisVitais.pressaoArterial"
          label="Pressão arterial"
          placeholder="120/80"
          keyboardType="numbers-and-punctuation"
        />
        <Texto
          control={control}
          name="sinaisVitais.frequenciaCardiaca"
          label="Frequência cardíaca (bpm)"
          keyboardType="number-pad"
          placeholder="Ex.: 72"
        />
        <Texto
          control={control}
          name="sinaisVitais.temperatura"
          label="Temperatura (°C)"
          keyboardType="decimal-pad"
          placeholder="Ex.: 36,5"
        />
        <Texto
          control={control}
          name="sinaisVitais.saturacaoOxigenio"
          label="Saturação de oxigênio (%)"
          keyboardType="number-pad"
          placeholder="Ex.: 98"
        />
      </Card>

      <Card titulo="Contato do médico particular">
        <Texto control={control} name="contatoMedico.nome" label="Nome" placeholder="Dr(a). ..." />
        <Texto
          control={control}
          name="contatoMedico.email"
          label="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="medico@exemplo.com"
        />
        <Texto
          control={control}
          name="contatoMedico.telefone"
          label="Telefone"
          keyboardType="phone-pad"
          placeholder="(46) 99999-9999"
          mascara={mascararTelefone}
        />
      </Card>

      <Card titulo="Observações">
        <Texto
          control={control}
          name="observacoes"
          label="Outras informações"
          placeholder="Algo que um atendimento precise saber"
          multiline
        />
      </Card>

      <ErrorMessage message={erro} />
      {sucesso ? <SuccessMessage message="Ficha salva." /> : null}
      <Button title="Salvar ficha" onPress={enviar} loading={salvando} />
    </View>
  );
}

interface TextoProps {
  control: Control<PerfilFormInput, unknown, PerfilFormOutput>;
  name: Campo;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof Input>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof Input>['autoCapitalize'];
  multiline?: boolean;
  /** Formata enquanto digita (CPF, telefone). O valor guardado é o mascarado. */
  mascara?: (v: string) => string;
}

/** Campo de texto ligado ao formulário — evita repetir Controller 20 vezes. */
function Texto({ control, name, label, mascara, multiline, ...rest }: TextoProps) {
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
  form: { gap: spacing.md },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
