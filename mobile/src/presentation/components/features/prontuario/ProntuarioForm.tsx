import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Controller, useForm, useWatch, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SEXOS } from '@domain/entities/PerfilSaude';
import { rotuloDoSintoma } from '@domain/entities/PreProntuario';
import {
  CAMPOS_POR_ETAPA,
  prontuarioSchema,
  type ProntuarioFormInput,
  type ProntuarioFormOutput,
} from '@domain/usecases/prontuario';
import { Body, Button, Card, ErrorMessage, Input, Opcoes } from '@presentation/components/ui';
import { mascararCPF, mascararData, mascararTelefone } from '@core/utils/formato';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';
import { Etapas } from './Etapas';
import { SeletorSintomas } from './SeletorSintomas';

const TOTAL_ETAPAS = 4;

interface Props {
  valoresIniciais: ProntuarioFormInput;
  onRascunho: (valores: ProntuarioFormInput) => void;
  onConcluir: (valores: ProntuarioFormOutput) => void;
  gerando: boolean;
  erro?: string | null;
}

type Campo = FieldPath<ProntuarioFormInput>;

export function ProntuarioForm({ valoresIniciais, onRascunho, onConcluir, gerando, erro }: Props) {
  const [etapa, setEtapa] = useState(1);
  const { control, handleSubmit, trigger, getValues } = useForm<
    ProntuarioFormInput,
    unknown,
    ProntuarioFormOutput
  >({
    resolver: zodResolver(prontuarioSchema),
    defaultValues: valoresIniciais,
    mode: 'onTouched',
  });

  // Rascunho automático: grava a cada mudança, como o site faz no localStorage.
  // A primeira passagem é pulada — senão os valores pré-preenchidos virariam
  // um "rascunho" e o aviso de recuperação apareceria sem o usuário ter digitado.
  const valores = useWatch({ control });
  const primeiraPassagem = useRef(true);
  useEffect(() => {
    if (primeiraPassagem.current) {
      primeiraPassagem.current = false;
      return;
    }
    onRascunho(getValues());
  }, [valores, getValues, onRascunho]);

  const avancar = async () => {
    const ok = await trigger(CAMPOS_POR_ETAPA[etapa]);
    if (ok) setEtapa((e) => Math.min(e + 1, TOTAL_ETAPAS));
  };

  return (
    <View style={styles.form}>
      <Etapas atual={etapa} />

      {etapa === 1 ? (
        <Card titulo="Dados pessoais">
          <Texto control={control} name="nome" label="Nome completo" placeholder="Como está no documento" />
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
            name="cpf"
            label="CPF"
            placeholder="000.000.000-00"
            keyboardType="number-pad"
            mascara={mascararCPF}
          />
          <Controller
            control={control}
            name="sexo"
            render={({ field, fieldState }) => (
              <Opcoes
                label="Sexo biológico"
                opcoes={SEXOS}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Texto
            control={control}
            name="telefone"
            label="Telefone"
            placeholder="(46) 99999-9999"
            keyboardType="phone-pad"
            mascara={mascararTelefone}
          />
        </Card>
      ) : null}

      {etapa === 2 ? (
        <Card titulo="Sintomas">
          <Texto
            control={control}
            name="queixaPrincipal"
            label="Queixa principal"
            placeholder="O que você está sentindo? Onde dói, com que intensidade..."
            multiline
          />
          <Texto
            control={control}
            name="tempoSintoma"
            label="Há quanto tempo"
            placeholder="Ex.: 2 dias, desde ontem à noite"
          />
          <Body>Marque os sintomas que também está sentindo:</Body>
          <Controller
            control={control}
            name="sintomas"
            render={({ field }) => <SeletorSintomas selecionados={field.value} onChange={field.onChange} />}
          />
        </Card>
      ) : null}

      {etapa === 3 ? (
        <>
          <Card titulo="Histórico clínico">
            <Texto control={control} name="alergias" label="Alergias" placeholder="Ex.: dipirona, poeira" multiline />
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
              placeholder="Ex.: hipertensão, diabetes"
              multiline
            />
            <Texto
              control={control}
              name="historicoFamiliar"
              label="Histórico familiar"
              placeholder="Doenças na família"
              multiline
            />
          </Card>
          <Card titulo="Sinais vitais">
            <Body>Preencha apenas o que tiver medido.</Body>
            <Texto control={control} name="pressaoArterial" label="Pressão arterial" placeholder="120/80" />
            <Texto
              control={control}
              name="frequenciaCardiaca"
              label="Frequência cardíaca (bpm)"
              placeholder="Ex.: 72"
              keyboardType="number-pad"
            />
            <Texto
              control={control}
              name="temperatura"
              label="Temperatura (°C)"
              placeholder="Ex.: 36,5"
              keyboardType="decimal-pad"
            />
            <Texto
              control={control}
              name="saturacaoOxigenio"
              label="Saturação de oxigênio (%)"
              placeholder="Ex.: 98"
              keyboardType="number-pad"
            />
            <Texto control={control} name="peso" label="Peso (kg)" placeholder="Ex.: 70,5" keyboardType="decimal-pad" />
            <Texto control={control} name="altura" label="Altura (m)" placeholder="Ex.: 1,75" keyboardType="decimal-pad" />
            <Texto
              control={control}
              name="observacoes"
              label="Observações"
              placeholder="Algo mais que o atendimento precise saber"
              multiline
            />
          </Card>
        </>
      ) : null}

      {etapa === 4 ? <Revisao control={control} /> : null}

      <ErrorMessage message={erro} />

      <View style={styles.acoes}>
        {etapa > 1 ? (
          <Button title="Voltar" variant="secondary" onPress={() => setEtapa((e) => e - 1)} style={styles.botao} />
        ) : null}
        {etapa < TOTAL_ETAPAS ? (
          <Button title="Continuar" onPress={avancar} style={styles.botao} />
        ) : (
          <Button
            title="Gerar pré-prontuário"
            onPress={handleSubmit(onConcluir)}
            loading={gerando}
            style={styles.botao}
          />
        )}
      </View>
    </View>
  );
}

/** Etapa 4: confere o que será enviado antes de gerar o documento. */
function Revisao({ control }: { control: Control<ProntuarioFormInput, unknown, ProntuarioFormOutput> }) {
  const v = useWatch({ control });

  const linha = (rotulo: string, valor?: string | null) =>
    valor && valor.trim() !== '' ? (
      <View style={styles.linha}>
        <Text style={styles.rotulo}>{rotulo}</Text>
        <Text style={styles.valor}>{valor}</Text>
      </View>
    ) : null;

  const sintomas = (v.sintomas ?? []).map(rotuloDoSintoma).join(', ');

  return (
    <Card titulo="Revisão">
      {linha('Nome', v.nome)}
      {linha('Nascimento', v.dataNascimento)}
      {linha('CPF', v.cpf)}
      {linha('Sexo', v.sexo)}
      {linha('Telefone', v.telefone)}
      {linha('Queixa', v.queixaPrincipal)}
      {linha('Tempo', v.tempoSintoma)}
      {linha('Sintomas', sintomas || 'Nenhum selecionado')}
      {linha('Pressão', v.pressaoArterial)}
      {linha('Frequência cardíaca', v.frequenciaCardiaca)}
      {linha('Temperatura', v.temperatura)}
      {linha('Saturação', v.saturacaoOxigenio)}
      <Body style={styles.aviso}>
        O documento será salvo no seu histórico e você poderá compartilhá-lo por e-mail, WhatsApp ou salvar o arquivo.
      </Body>
    </Card>
  );
}

interface TextoProps {
  control: Control<ProntuarioFormInput, unknown, ProntuarioFormOutput>;
  name: Campo;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof Input>['keyboardType'];
  multiline?: boolean;
  mascara?: (v: string) => string;
}

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
  acoes: { flexDirection: 'row', gap: spacing.sm },
  botao: { flex: 1 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  linha: { gap: 2 },
  rotulo: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight, textTransform: 'uppercase' },
  valor: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text },
  aviso: { fontSize: fontSizes.xs, color: colors.textLight, marginTop: spacing.sm },
});
