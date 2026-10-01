import type { Sexo } from './PerfilSaude';

/**
 * Lista fixa do formulário do site, na mesma ordem.
 * `coluna` é o nome na tabela `sintomas_atendimento`; `rotulo` é o que aparece
 * na tela e no PDF. O site guarda os rótulos e converte na hora de salvar.
 */
export const SINTOMAS = [
  { coluna: 'febre', rotulo: 'Febre', icone: 'temperature-high' },
  { coluna: 'dor_de_cabeca', rotulo: 'Dor de Cabeça', icone: 'head-side-virus' },
  { coluna: 'tosse', rotulo: 'Tosse', icone: 'head-side-cough' },
  { coluna: 'falta_de_ar', rotulo: 'Falta de Ar', icone: 'lungs' },
  { coluna: 'dor_no_peito', rotulo: 'Dor no Peito', icone: 'heart-pulse' },
  { coluna: 'nausea_vomito', rotulo: 'Náusea/Vômito', icone: 'face-dizzy' },
  { coluna: 'diarreia', rotulo: 'Diarreia', icone: 'toilet' },
  { coluna: 'dor_abdominal', rotulo: 'Dor Abdominal', icone: 'person-circle-exclamation' },
  { coluna: 'dor_nas_costas', rotulo: 'Dor nas Costas', icone: 'person' },
  { coluna: 'tontura', rotulo: 'Tontura', icone: 'arrows-spin' },
  { coluna: 'fraqueza', rotulo: 'Fraqueza/Cansaço', icone: 'bed' },
  { coluna: 'coriza', rotulo: 'Coriza', icone: 'droplet' },
] as const;

export type ColunaSintoma = (typeof SINTOMAS)[number]['coluna'];

export interface PreProntuario {
  // Etapa 1 — quem é
  nome: string;
  dataNascimento: string; // AAAA-MM-DD
  cpf: string; // só dígitos
  sexo: Sexo;
  telefone: string;

  // Etapa 2 — o que está sentindo
  queixaPrincipal: string;
  tempoSintoma: string | null;
  sintomas: ColunaSintoma[];

  // Etapa 3 — histórico e sinais vitais
  alergias: string | null;
  medicamentosEmUso: string | null;
  doencasPreexistentes: string | null;
  historicoFamiliar: string | null;
  pressaoArterial: string | null;
  frequenciaCardiaca: number | null;
  temperatura: number | null;
  saturacaoOxigenio: number | null;
  peso: number | null;
  altura: number | null;
  observacoes: string | null;

  /** Contexto do histórico para quem atende; não passa pelo formulário. */
  historicoRecente?: HistoricoRecenteDocumento;
}

export interface HistoricoRecenteDocumento {
  /** Outros episódios dos últimos 30 dias, sem ligação com a queixa ("29/09 18:10 — dor no joelho (nível 1)"). */
  outrasQueixas: string[];
  /** Recorrência da queixa nos últimos 6 meses ("dor de cabeça: 3 episódios…"). */
  recorrencia: string[];
}

export const rotuloDoSintoma = (coluna: ColunaSintoma): string =>
  SINTOMAS.find((s) => s.coluna === coluna)?.rotulo ?? coluna;
