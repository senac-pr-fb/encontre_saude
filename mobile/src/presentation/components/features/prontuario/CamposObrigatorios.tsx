import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CampoObrigatorio } from '@domain/entities/ContextoSaude';
import {
  prontuarioSchema,
  type ProntuarioFormInput,
  type ProntuarioFormOutput,
} from '@domain/usecases/prontuario';
import type { DadosObrigatorios } from '@domain/usecases/perfil';
import { Body, Button, Card, ErrorMessage } from '@presentation/components/ui';
import { CamposDadosPessoais } from './CamposDadosPessoais';

interface Props {
  faltantes: CampoObrigatorio[];
  valoresIniciais: ProntuarioFormInput;
  onSalvar: (dados: DadosObrigatorios) => void;
  salvando: boolean;
  erro?: string | null;
}

/**
 * Só os obrigatórios que a ficha não tem — faltando o CPF, aparece só o CPF.
 * Salvos na ficha, não são pedidos de novo.
 */
export function CamposObrigatorios({ faltantes, valoresIniciais, onSalvar, salvando, erro }: Props) {
  const { control, trigger, getValues } = useForm<ProntuarioFormInput, unknown, ProntuarioFormOutput>({
    resolver: zodResolver(prontuarioSchema),
    // Sem sexo na ficha, nada vem marcado: o padrão do formulário passaria despercebido.
    defaultValues: faltantes.includes('sexo') ? { ...valoresIniciais, sexo: undefined } : valoresIniciais,
    mode: 'onTouched',
  });

  const salvar = async () => {
    // Valida só o que está na tela; o resto do formulário não importa aqui.
    if (!(await trigger(faltantes))) return;
    const valores = getValues();
    onSalvar(Object.fromEntries(faltantes.map((c) => [c, valores[c]])) as DadosObrigatorios);
  };

  return (
    <Card titulo={faltantes.length === 1 ? 'Falta um dado' : 'Faltam alguns dados'}>
      <Body>Para gerar o documento, complete abaixo. Fica salvo na sua ficha e não será pedido de novo.</Body>
      <CamposDadosPessoais control={control} campos={faltantes} />
      <ErrorMessage message={erro} />
      <Button title="Salvar e continuar" onPress={salvar} loading={salvando} />
    </Card>
  );
}
