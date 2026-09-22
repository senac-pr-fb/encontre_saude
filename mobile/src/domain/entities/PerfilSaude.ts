export const SEXOS = ['Masculino', 'Feminino', 'Outro'] as const;
export type Sexo = (typeof SEXOS)[number];

/** Coluna jsonb `contato_medico_particular` na tabela dados_saude. */
export interface ContatoMedico {
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

export interface SinaisVitais {
  pressaoArterial: string | null;
  frequenciaCardiaca: number | null;
  temperatura: number | null;
  saturacaoOxigenio: number | null;
}

export interface PerfilSaude {
  userId: string;
  idade: number | null;
  peso: number | null;
  altura: number | null;
  sexo: Sexo | null;
  /** Só dígitos; a máscara é aplicada na apresentação. */
  cpf: string | null;
  /** ISO curto (YYYY-MM-DD), como a coluna date do Postgres. */
  dataNascimento: string | null;
  telefone: string | null;
  fuma: boolean;
  bebe: boolean;
  alergias: string | null;
  alergiaMedicamento: string | null;
  medicamentosEmUso: string | null;
  doencasPreexistentes: string | null;
  historicoFamiliar: string | null;
  possuiDeficiencia: string | null;
  contatoMedico: ContatoMedico;
  sinaisVitais: SinaisVitais;
  observacoes: string | null;
}

/** Perfil vazio para quem ainda não preencheu a ficha. */
export function perfilVazio(userId: string): PerfilSaude {
  return {
    userId,
    idade: null,
    peso: null,
    altura: null,
    sexo: null,
    cpf: null,
    dataNascimento: null,
    telefone: null,
    fuma: false,
    bebe: false,
    alergias: null,
    alergiaMedicamento: null,
    medicamentosEmUso: null,
    doencasPreexistentes: null,
    historicoFamiliar: null,
    possuiDeficiencia: null,
    contatoMedico: { nome: null, email: null, telefone: null },
    sinaisVitais: { pressaoArterial: null, frequenciaCardiaca: null, temperatura: null, saturacaoOxigenio: null },
    observacoes: null,
  };
}
