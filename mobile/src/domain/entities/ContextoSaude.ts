import type { PerfilSaude } from './PerfilSaude';
import type { InteracaoHistorico, Triagem } from './Triagem';

/** Entrada do histórico que passou pela IA (as do pré-prontuário manual não têm triagem). */
export type TriagemDoHistorico = InteracaoHistorico & { triagem: Triagem };

/** Campos sem os quais o documento não sai — os mesmos da etapa 1 do formulário. */
export const CAMPOS_OBRIGATORIOS = ['nome', 'dataNascimento', 'cpf', 'sexo', 'telefone'] as const;
export type CampoObrigatorio = (typeof CAMPOS_OBRIGATORIOS)[number];

export const ROTULOS_CAMPOS_OBRIGATORIOS: Record<CampoObrigatorio, string> = {
  nome: 'Nome completo',
  dataNascimento: 'Data de nascimento',
  cpf: 'CPF',
  sexo: 'Sexo biológico',
  telefone: 'Telefone',
};

/**
 * Por quanto tempo uma triagem serve de queixa para o documento. Passado isso,
 * o que a pessoa sente provavelmente já é outra coisa.
 */
export const VALIDADE_TRIAGEM_DOCUMENTO_MS = 24 * 60 * 60 * 1000;

/**
 * O que o botão do meio faz:
 *  - sem-triagem / triagem-vencida: leva à pré-triagem;
 *  - dados-faltando: leva à pré-triagem para completar a ficha;
 *  - pronto: gera o PDF.
 */
export type SituacaoDocumento = 'pronto' | 'dados-faltando' | 'sem-triagem' | 'triagem-vencida';

/** Tudo o que o app sabe da saúde do usuário, montado a partir da ficha e do histórico. */
export interface ContextoSaude {
  perfil: PerfilSaude;
  /** false enquanto a ficha nunca foi salva. */
  fichaExiste: boolean;
  /** O nome pertence à conta, não à ficha. */
  nome: string | null;
  ultimaTriagem: TriagemDoHistorico | null;
  triagemValida: boolean;
  faltantes: CampoObrigatorio[];
  situacao: SituacaoDocumento;
}
