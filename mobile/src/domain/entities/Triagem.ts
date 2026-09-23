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

export interface InteracaoHistorico {
  id: string;
  quando: string;
  descricao: string;
  /** null quando o registro veio do pre-prontuario, que nao passa pela IA. */
  triagem: Triagem | null;
  sintomas: ColunaSintoma[];
}

export const ehNivelValido = (n: number): n is NivelUrgencia => n >= 1 && n <= 5;
