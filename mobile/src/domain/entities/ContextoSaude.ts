import type { PerfilSaude } from './PerfilSaude';
import type { ColunaSintoma } from './PreProntuario';
import type { InteracaoHistorico, Triagem } from './Triagem';

/** Entrada do histórico que passou pela IA (as do pré-prontuário manual não têm triagem). */
export type TriagemDoHistorico = InteracaoHistorico & { triagem: Triagem };

/**
 * Relatos sobre o mesmo problema ("dor de cabeça há 2 h" + "agora febre").
 * Cada relato continua sendo um registro; o episódio só os agrupa.
 */
export interface Episodio {
  /** Id do primeiro relato. */
  id: string;
  /** Em ordem cronológica. */
  entradas: InteracaoHistorico[];
  /** Último relato com triagem da IA: é o que define o nível. */
  ultimaTriagem: TriagemDoHistorico | null;
  inicio: string;
  fim: string;
  rotulo: string | null;
  /** Soma dos sintomas de todos os relatos. */
  sintomas: ColunaSintoma[];
}

/** Episódios cujo último relato passou de 30 dias não entram em "outras queixas". */
export const JANELA_OUTRAS_QUEIXAS_MS = 30 * 24 * 60 * 60 * 1000;

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
  /** Todos os episódios do histórico carregado, mais recente primeiro. */
  episodios: Episodio[];
  /** Episódio mais recente com triagem; é a queixa padrão do documento. */
  episodioAtual: Episodio | null;
  /** Episódios com triagem ainda válida (24 h). Mais de um: o documento pergunta qual. */
  episodiosAtivos: Episodio[];
  /** Última triagem do episódio atual. */
  ultimaTriagem: TriagemDoHistorico | null;
  triagemValida: boolean;
  faltantes: CampoObrigatorio[];
  /** 0–100: obrigatórios válidos + histórico clínico preenchido. */
  completude: number;
  situacao: SituacaoDocumento;
}
