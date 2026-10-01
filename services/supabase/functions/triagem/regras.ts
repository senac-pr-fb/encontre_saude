/**
 * Regras da triagem que não dependem de rede nem de banco: entrada, o que da
 * ficha vai ao modelo e o que se aceita da resposta dele. Funções puras, para
 * serem testadas sem Supabase nem provedor de IA (ver tests/).
 */
import type { Episodio } from './historico.ts';
import { MAX_PERGUNTAS, type Triagem } from './schema.ts';

export const LIMITE_RESPOSTA = 500;
export const MAX_RESPOSTAS = 5;

export interface Resposta {
  pergunta: string;
  resposta: string;
}

/** Só as colunas clínicas: identificação (nome, CPF, telefone) nunca vai ao modelo. */
export const COLUNAS_FICHA =
  'idade, data_nascimento, sexo, peso, altura, fuma, bebe, alergias, alergia_medicamento, ' +
  'medicamentos_em_uso, doencas_preexistentes, possui_deficiencia';

export interface Ficha {
  idade: number | null;
  data_nascimento: string | null;
  sexo: string | null;
  peso: number | null;
  altura: number | null;
  fuma: boolean | null;
  bebe: boolean | null;
  alergias: string | null;
  alergia_medicamento: string | null;
  medicamentos_em_uso: string | null;
  doencas_preexistentes: string | null;
  possui_deficiencia: string | null;
}

/**
 * Idade a partir da data da coluna (AAAA-MM-DD). Compara só ano/mês/dia, em UTC
 * dos dois lados: `new Date('1990-05-10')` é meia-noite UTC, e misturar com o
 * fuso local fazia o aniversário cair um dia antes.
 */
export function idadeDe(ficha: Ficha, hoje: Date = new Date()): number | null {
  const partes = ficha.data_nascimento?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!partes) return ficha.idade;
  const [ano, mes, dia] = partes.slice(1).map(Number);
  let anos = hoje.getUTCFullYear() - ano;
  const mesHoje = hoje.getUTCMonth() + 1;
  const fezAniversario = mesHoje > mes || (mesHoje === mes && hoje.getUTCDate() >= dia);
  if (!fezAniversario) anos -= 1;
  return anos;
}

/** Resumo da ficha para o prompt. A data de nascimento vira idade aqui e não sai daqui. */
export function resumoDaFicha(ficha: Ficha | null, hoje: Date = new Date()): string {
  if (!ficha) return 'Ficha de saúde: o paciente ainda não preencheu.';
  const v = (x: string | number | null | undefined) =>
    x === null || x === undefined || String(x).trim() === '' ? 'não informado' : String(x);
  const sn = (x: boolean | null) => (x === null ? 'não informado' : x ? 'sim' : 'não');
  return [
    'Ficha de saúde (preenchida pelo paciente):',
    `- Idade: ${v(idadeDe(ficha, hoje))}`,
    `- Sexo: ${v(ficha.sexo)}`,
    `- Peso (kg): ${v(ficha.peso)} · Altura (m): ${v(ficha.altura)}`,
    `- Fuma: ${sn(ficha.fuma)} · Bebe: ${sn(ficha.bebe)}`,
    `- Alergias: ${v(ficha.alergias)}`,
    `- Alergia a medicamentos: ${v(ficha.alergia_medicamento)}`,
    `- Medicamentos em uso: ${v(ficha.medicamentos_em_uso)}`,
    `- Doenças preexistentes: ${v(ficha.doencas_preexistentes)}`,
    `- Deficiência: ${v(ficha.possui_deficiencia)}`,
  ].join('\n');
}

/** O que fica no histórico (e vira a queixa do pré-prontuário): relato + respostas. */
export function textoDoEpisodio(descricao: string, respostas: Resposta[]): string {
  if (respostas.length === 0) return descricao;
  const qa = respostas.map((r) => `${r.pergunta}\n${r.resposta}`).join('\n\n');
  return `${descricao}\n\n${qa}`;
}

/** Respostas da segunda rodada; string quando a entrada é inválida (vira 400). */
export function lerRespostas(bruto: unknown): Resposta[] | string {
  if (bruto === undefined || bruto === null) return [];
  if (!Array.isArray(bruto) || bruto.length > MAX_RESPOSTAS) return 'Respostas inválidas';
  const respostas: Resposta[] = [];
  for (const item of bruto) {
    const pergunta = typeof item?.pergunta === 'string' ? item.pergunta.trim() : '';
    const resposta = typeof item?.resposta === 'string' ? item.resposta.trim() : '';
    if (!pergunta || pergunta.length > LIMITE_RESPOSTA || resposta.length > LIMITE_RESPOSTA) {
      return `Cada resposta deve ter no máximo ${LIMITE_RESPOSTA} caracteres`;
    }
    if (resposta) respostas.push({ pergunta, resposta });
  }
  return respostas;
}

/**
 * As regras das perguntas valem aqui também, não só no prompt: nenhuma na
 * segunda rodada nem em emergência (nada deve atrasar a busca por atendimento).
 */
export function limitarPerguntas(triagem: Triagem, segundaRodada: boolean): Triagem['perguntas'] {
  if (segundaRodada || triagem.nivel === 5) return [];
  return triagem.perguntas.slice(0, MAX_PERGUNTAS);
}

/**
 * A IA sugere a ligação com um relato recente; só vale se o código for um dos
 * candidatos enviados a ela. Qualquer outra coisa vira episódio novo.
 */
export function episodioIndicado(triagem: Triagem, candidatos: Map<string, Episodio>): Episodio | null {
  if (triagem.relacao !== 'continuacao' || !triagem.episodio_relacionado) return null;
  return candidatos.get(triagem.episodio_relacionado.trim().toUpperCase()) ?? null;
}
