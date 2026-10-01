import type { ColunaSintoma } from './PreProntuario';

/** Escala do site (sintomas_ai/api.js + create_feedback.js), cor e texto juntos. */
export const NIVEIS = {
  1: {
    cor: '#5EA7FF',
    texto: 'Não Urgente',
    resumo: 'Sintomas leves, sem risco imediato.',
    conduta: 'Atendimento na unidade de saúde mais próxima da residência.',
  },
  2: {
    cor: '#ABFB4F',
    texto: 'Pouco Urgente',
    resumo: 'Desconforto moderado, observe a evolução.',
    conduta: 'Atendimento preferencial nas unidades de atenção básica.',
  },
  3: {
    cor: '#FFEA00',
    texto: 'Urgente',
    resumo: 'Sintomas significativos, busque ajuda se persistir.',
    conduta: 'Gravidade moderada: precisa de atendimento médico, sem risco imediato.',
  },
  4: {
    cor: '#FF771C',
    texto: 'Muito Urgente',
    resumo: 'Sintomas intensos, requer atenção rápida.',
    conduta: 'Caso grave, com risco significativo. Atendimento urgente.',
  },
  5: {
    cor: '#D51717',
    texto: 'Emergência',
    resumo: 'Risco à vida, procure atendimento imediato (192).',
    conduta: 'Caso gravíssimo: atendimento imediato e risco de morte.',
  },
} as const;

export type NivelUrgencia = keyof typeof NIVEIS;

export const NIVEIS_ORDENADOS = [1, 2, 3, 4, 5] as const;

export interface Triagem {
  nivel: NivelUrgencia;
  resumo: string;
  recomendacao: string;
  primeirosSocorros: string;
  unidadeRecomendada: string;
  sintomas: ColunaSintoma[];
}

/**
 * Quantas vezes uma queixa apareceu nos últimos 6 meses, contada por episódio
 * (continuações não inflam a conta). Calculada pela Edge Function antes do relato.
 */
export interface ItemRecorrencia {
  rotulo: string;
  episodios: number;
  ultimos30Dias: number;
  ultimoEm: string;
  nivelMax: number | null;
}

export interface InteracaoHistorico {
  id: string;
  quando: string;
  descricao: string;
  /** null quando o registro veio do pre-prontuario, que nao passa pela IA. */
  triagem: Triagem | null;
  sintomas: ColunaSintoma[];
  /** Primeiro relato do episódio; null quando este registro é o início. */
  episodioId: string | null;
  /** Rótulo curto da queixa ("dor de cabeça"); null em registros antigos. */
  rotulo: string | null;
  /** Recorrência no momento da triagem (vai para o PDF). */
  recorrencia: ItemRecorrencia[];
}

export const ehNivelValido = (n: number): n is NivelUrgencia => n >= 1 && n <= 5;

/** O que cada pergunta de acompanhamento ajuda a esclarecer (enum da Edge Function). */
export type CampoPergunta = 'alergias' | 'medicamentos_em_uso' | 'doencas_preexistentes' | 'sintoma';

export interface PerguntaTriagem {
  campo: CampoPergunta;
  pergunta: string;
}

export interface RespostaTriagem {
  pergunta: string;
  resposta: string;
}

/**
 * Dados clínicos que o paciente afirmou na conversa. São só sugestões: a ficha
 * muda apenas depois que ele confirma.
 */
export interface AtualizacoesFicha {
  alergias: string | null;
  medicamentosEmUso: string | null;
  doencasPreexistentes: string | null;
  /** Não vem da IA: anotação de recorrência sugerida pelo app. */
  observacoes?: string | null;
}

/** Resultado de uma rodada da pré-triagem. */
export interface AnaliseTriagem {
  triagem: Triagem;
  /** Vazio na segunda rodada e em emergência. */
  perguntas: PerguntaTriagem[];
  atualizacoes: AtualizacoesFicha;
  /** Registro do histórico; a segunda rodada atualiza o mesmo. */
  historicoId: string | null;
  rotulo: string | null;
  /** Episódio a que a IA ligou este relato; null quando é um problema novo. */
  episodioAnterior: EpisodioAnterior | null;
  recorrencia: ItemRecorrencia[];
}

export interface EpisodioAnterior {
  id: string;
  desde: string;
  rotulo: string | null;
}

/** Segunda rodada: respostas às perguntas da primeira. */
export interface ComplementoTriagem {
  respostas: RespostaTriagem[];
  historicoId: string | null;
}
