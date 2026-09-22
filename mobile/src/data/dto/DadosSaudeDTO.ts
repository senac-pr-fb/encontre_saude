/**
 * Formato cru da tabela `dados_saude` — o único lugar do app que conhece
 * snake_case, o `CPF` em maiúsculas e os sinais vitais achatados em colunas.
 */
export interface ContatoMedicoDTO {
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

export interface DadosSaudeDTO {
  user_id: string;
  idade: number | null;
  peso: number | null;
  altura: number | null;
  sexo: string | null;
  CPF: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  fuma: boolean | null;
  bebe: boolean | null;
  alergias: string | null;
  alergia_medicamento: string | null;
  medicamentos_em_uso: string | null;
  doencas_preexistentes: string | null;
  historico_familiar: string | null;
  possui_deficiencia: string | null;
  /** jsonb; o site grava um objeto, versões antigas podem ter gravado string. */
  contato_medico_particular: ContatoMedicoDTO | string | null;
  pressao_arterial: string | null;
  frequencia_cardiaca: number | null;
  temperatura: number | null;
  saturacao_oxigenio: number | null;
  observacoes: string | null;
}
