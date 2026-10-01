import { Controller } from 'react-hook-form';
import { SEXOS } from '@domain/entities/PerfilSaude';
import type { CampoObrigatorio } from '@domain/entities/ContextoSaude';
import { Opcoes } from '@presentation/components/ui';
import { mascararCPF, mascararData, mascararTelefone } from '@core/utils/formato';
import { CampoTexto, type ControleProntuario } from './CampoTexto';

interface Props {
  control: ControleProntuario;
  /** Quais campos mostrar, na ordem do formulário. */
  campos: readonly CampoObrigatorio[];
}

/**
 * Dados pessoais do documento. A etapa 1 mostra todos; "completar dados" mostra
 * só os que faltam na ficha.
 */
export function CamposDadosPessoais({ control, campos }: Props) {
  const mostrar = (c: CampoObrigatorio) => campos.includes(c);

  return (
    <>
      {mostrar('nome') ? (
        <CampoTexto control={control} name="nome" label="Nome completo" placeholder="Como está no documento" />
      ) : null}
      {mostrar('dataNascimento') ? (
        <CampoTexto
          control={control}
          name="dataNascimento"
          label="Data de nascimento"
          placeholder="dd/mm/aaaa"
          keyboardType="number-pad"
          mascara={mascararData}
        />
      ) : null}
      {mostrar('cpf') ? (
        <CampoTexto
          control={control}
          name="cpf"
          label="CPF"
          placeholder="000.000.000-00"
          keyboardType="number-pad"
          mascara={mascararCPF}
        />
      ) : null}
      {mostrar('sexo') ? (
        <Controller
          control={control}
          name="sexo"
          render={({ field, fieldState }) => (
            <Opcoes
              label="Sexo biológico"
              opcoes={SEXOS}
              value={field.value ?? null}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      ) : null}
      {mostrar('telefone') ? (
        <CampoTexto
          control={control}
          name="telefone"
          label="Telefone"
          placeholder="(46) 99999-9999"
          keyboardType="phone-pad"
          mascara={mascararTelefone}
        />
      ) : null}
    </>
  );
}
