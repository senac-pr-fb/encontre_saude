/**
 * Histórico como contexto da triagem: episódios recentes (candidatos a
 * continuação) e recorrência. Funções puras — a leitura do banco fica no index.
 *
 * Para o modelo só vão resumos: relatos recentes truncados (≤ 72 h) e, dos
 * últimos 6 meses, apenas contagens e datas. Nenhum texto antigo.
 */

export const JANELA_EPISODIO_MS = 72 * 60 * 60 * 1000;
export const JANELA_RECORRENCIA_DIAS = 182;
export const MAX_CANDIDATOS = 5;
const MAX_RECORRENCIA = 8;
const TRECHO_RELATO = 160;
const DIA_MS = 24 * 60 * 60 * 1000;

/** Rótulos das colunas de `sintomas_atendimento`, iguais aos do app. */
const ROTULOS_SINTOMAS: Record<string, string> = {
  febre: 'febre',
  dor_de_cabeca: 'dor de cabeça',
  tosse: 'tosse',
  falta_de_ar: 'falta de ar',
  dor_no_peito: 'dor no peito',
  nausea_vomito: 'náusea/vômito',
  diarreia: 'diarreia',
  dor_abdominal: 'dor abdominal',
  dor_nas_costas: 'dor nas costas',
  tontura: 'tontura',
  fraqueza: 'fraqueza/cansaço',
  coriza: 'coriza',
};

export interface LinhaHistorico {
  id: number | string;
  created_at: string;
  descricao_usuario: string | null;
  resposta_ia: string | null;
  episodio_id?: number | string | null;
  queixa_rotulo?: string | null;
  sintomas_atendimento?: Record<string, unknown> | Record<string, unknown>[] | null;
}

export interface Episodio {
  /** Id do primeiro relato; é o valor gravado em `episodio_id` dos seguintes. */
  chave: string;
  linhas: LinhaHistorico[];
  inicio: number;
  ultimo: number;
  rotulos: Set<string>;
  nivelUltimo: number | null;
  nivelMax: number | null;
}

export interface ItemRecorrencia {
  rotulo: string;
  episodios: number;
  ultimos_30_dias: number;
  ultimo_em: string;
  nivel_max: number | null;
}

export const normalizarRotulo = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40);

function nivelDe(resposta: string | null): number | null {
  if (!resposta) return null;
  try {
    const n = Number(JSON.parse(resposta)?.nivel);
    return n >= 1 && n <= 5 ? n : null;
  } catch {
    // Registros do pré-prontuário manual têm texto fixo, não JSON.
    return null;
  }
}

function rotulosDaLinha(l: LinhaHistorico): string[] {
  const s = Array.isArray(l.sintomas_atendimento) ? l.sintomas_atendimento[0] : l.sintomas_atendimento;
  const doSintoma = Object.entries(ROTULOS_SINTOMAS)
    .filter(([coluna]) => s?.[coluna] === true)
    .map(([, rotulo]) => rotulo);
  return l.queixa_rotulo ? [...doSintoma, normalizarRotulo(l.queixa_rotulo)] : doSintoma;
}

/** Agrupa relatos por episódio (`episodio_id` ou o próprio id). Mais recente primeiro. */
export function agruparEpisodios(linhas: LinhaHistorico[]): Episodio[] {
  const porChave = new Map<string, Episodio>();
  const ordenadas = [...linhas].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  for (const l of ordenadas) {
    const chave = String(l.episodio_id ?? l.id);
    const quando = Date.parse(l.created_at);
    const nivel = nivelDe(l.resposta_ia);
    let ep = porChave.get(chave);
    if (!ep) {
      ep = { chave, linhas: [], inicio: quando, ultimo: quando, rotulos: new Set(), nivelUltimo: null, nivelMax: null };
      porChave.set(chave, ep);
    }
    ep.linhas.push(l);
    ep.ultimo = Math.max(ep.ultimo, quando);
    rotulosDaLinha(l).forEach((r) => ep!.rotulos.add(r));
    if (nivel !== null) {
      ep.nivelUltimo = nivel;
      ep.nivelMax = Math.max(ep.nivelMax ?? 0, nivel);
    }
  }

  return [...porChave.values()].sort((a, b) => b.ultimo - a.ultimo);
}

/** Episódios com relato nas últimas 72 h, rotulados E1, E2… para o modelo citar. */
export function candidatosAContinuacao(episodios: Episodio[], agora: number): Map<string, Episodio> {
  const recentes = episodios.filter((e) => agora - e.ultimo <= JANELA_EPISODIO_MS).slice(0, MAX_CANDIDATOS);
  return new Map(recentes.map((e, i) => [`E${i + 1}`, e]));
}

/** Contagem por episódio (não por relato): continuações não inflam a recorrência. */
export function calcularRecorrencia(episodios: Episodio[], agora: number): ItemRecorrencia[] {
  const itens = new Map<string, ItemRecorrencia>();
  for (const e of episodios) {
    for (const rotulo of e.rotulos) {
      const item = itens.get(rotulo) ?? { rotulo, episodios: 0, ultimos_30_dias: 0, ultimo_em: '', nivel_max: null };
      item.episodios += 1;
      if (agora - e.ultimo <= 30 * DIA_MS) item.ultimos_30_dias += 1;
      if (!item.ultimo_em || e.ultimo > Date.parse(item.ultimo_em)) item.ultimo_em = new Date(e.ultimo).toISOString();
      if (e.nivelMax !== null) item.nivel_max = Math.max(item.nivel_max ?? 0, e.nivelMax);
      itens.set(rotulo, item);
    }
  }
  return [...itens.values()].sort((a, b) => b.episodios - a.episodios).slice(0, MAX_RECORRENCIA);
}

const haQuanto = (ms: number) => {
  const horas = Math.round(ms / (60 * 60 * 1000));
  if (horas < 1) return 'há menos de 1 h';
  if (horas < 48) return `há ${horas} h`;
  return `há ${Math.round(horas / 24)} dias`;
};

const trecho = (s: string | null) => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > TRECHO_RELATO ? `${t.slice(0, TRECHO_RELATO)}…` : t;
};

export function textoCandidatos(candidatos: Map<string, Episodio>, agora: number): string {
  if (candidatos.size === 0) return 'Relatos recentes (72 h): nenhum.';
  const blocos = [...candidatos].map(([codigo, e]) => {
    const cabecalho =
      `[${codigo}] ${haQuanto(agora - e.ultimo)} · ` +
      `${[...e.rotulos].join(', ') || 'sem rótulo'} · nível ${e.nivelUltimo ?? '—'}`;
    // Os dois relatos mais recentes do episódio bastam para decidir se é continuação.
    const relatos = e.linhas.slice(-2).map((l) => `    "${trecho(l.descricao_usuario)}"`);
    return [cabecalho, ...relatos].join('\n');
  });
  return `Relatos recentes (72 h), candidatos a continuação:\n${blocos.join('\n')}`;
}

export function textoRecorrencia(itens: ItemRecorrencia[], agora: number): string {
  if (itens.length === 0) return 'Recorrência (6 meses): nenhum relato anterior.';
  const linhas = itens.map(
    (i) =>
      `- ${i.rotulo}: ${i.episodios} ${i.episodios === 1 ? 'episódio' : 'episódios'} · ` +
      `${i.ultimos_30_dias} nos últimos 30 dias · último ${haQuanto(agora - Date.parse(i.ultimo_em))} · ` +
      `nível máx. ${i.nivel_max ?? '—'}`,
  );
  return `Recorrência (6 meses, contada por episódio, antes deste relato):\n${linhas.join('\n')}`;
}

/** Rótulos já usados, para o modelo reaproveitar e a contagem não se fragmentar. */
export function rotulosConhecidos(episodios: Episodio[]): string[] {
  const todos = new Set<string>();
  for (const e of episodios) for (const l of e.linhas) if (l.queixa_rotulo) todos.add(normalizarRotulo(l.queixa_rotulo));
  return [...todos].slice(0, 20);
}
