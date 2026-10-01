import type { SupabaseClient } from '@supabase/supabase-js';
import type { TriagemRepository } from '@domain/repositories/TriagemRepository';
import type {
  AnaliseTriagem,
  ComplementoTriagem,
  InteracaoHistorico,
  ItemRecorrencia,
  PerguntaTriagem,
  Triagem,
} from '@domain/entities/Triagem';
import { ehNivelValido } from '@domain/entities/Triagem';
import { SINTOMAS, type ColunaSintoma } from '@domain/entities/PreProntuario';
import { DomainError } from '@domain/errors';
import { ok, err, type Result } from '@core/utils/result';
import { toDomainError } from './errors';

/** Formato devolvido pela Edge Function `triagem` (snake_case, como o site). */
interface TriagemDTO {
  nivel: number;
  resumo: string;
  recomendacao: string;
  primeiros_socorros: string;
  unidade_recomendada: string;
  sintomas: Record<string, boolean>;
}

/** Campos da conversa. Opcionais: a versão anterior da função não os devolve. */
interface AnaliseDTO extends TriagemDTO {
  perguntas?: PerguntaTriagem[] | null;
  atualizacoes_ficha?: {
    alergias?: string | null;
    medicamentos_em_uso?: string | null;
    doencas_preexistentes?: string | null;
  } | null;
  historico_id?: number | string | null;
  queixa_rotulo?: string | null;
  episodio?: { id: number | string; desde: string; rotulo: string | null } | null;
  recorrencia?: RecorrenciaDTO[] | null;
}

interface RecorrenciaDTO {
  rotulo: string;
  episodios: number;
  ultimos_30_dias: number;
  ultimo_em: string;
  nivel_max: number | null;
}

const paraRecorrencia = (lista: RecorrenciaDTO[] | null | undefined): ItemRecorrencia[] =>
  (Array.isArray(lista) ? lista : [])
    .filter((r) => typeof r?.rotulo === 'string' && Number.isFinite(r?.episodios))
    .map((r) => ({
      rotulo: r.rotulo,
      episodios: r.episodios,
      ultimos30Dias: r.ultimos_30_dias ?? 0,
      ultimoEm: r.ultimo_em ?? '',
      nivelMax: r.nivel_max ?? null,
    }));

const COLUNAS_BASE = 'id, created_at, descricao_usuario, resposta_ia, sintomas_atendimento(*)';

const sintomasMarcados = (mapa: Record<string, boolean> | null | undefined): ColunaSintoma[] =>
  SINTOMAS.map((s) => s.coluna).filter((c) => Boolean(mapa?.[c]));

function paraTriagem(d: TriagemDTO): Triagem {
  const nivel = Number(d.nivel);
  return {
    nivel: ehNivelValido(nivel) ? nivel : 1,
    resumo: d.resumo ?? '',
    recomendacao: d.recomendacao ?? '',
    primeirosSocorros: d.primeiros_socorros ?? '',
    unidadeRecomendada: d.unidade_recomendada ?? '',
    sintomas: sintomasMarcados(d.sintomas),
  };
}

export class SupabaseTriagemRepository implements TriagemRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * O prompt, a chave do modelo e a gravação do histórico vivem na Edge
   * Function — nada disso entra no bundle. O supabase-js anexa o JWT do
   * usuário automaticamente, e a função recusa chamadas sem ele.
   */
  async analisar(descricao: string, complemento?: ComplementoTriagem): Promise<Result<AnaliseTriagem, DomainError>> {
    const body = complemento
      ? { descricao, respostas: complemento.respostas, historico_id: complemento.historicoId }
      : { descricao };
    const { data, error } = await this.supabase.functions.invoke<AnaliseDTO & { erro?: string }>('triagem', { body });

    if (error) {
      // O corpo de erro da função traz a mensagem em `erro`; o SDK só expõe o status.
      const detalhe = await lerMensagem(error);
      return err(new DomainError(detalhe ?? 'Não foi possível analisar os sintomas agora', 'TRIAGEM'));
    }
    if (!data || data.erro) {
      return err(new DomainError(data?.erro ?? 'Resposta vazia da triagem', 'TRIAGEM'));
    }

    return ok(paraAnalise(data));
  }

  async historico(userId: string): Promise<Result<InteracaoHistorico[], DomainError>> {
    const consultar = (colunas: string) =>
      this.supabase
        .from('historico_ia')
        .select(colunas)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    // Sem a migration de episódios, as colunas novas não existem: lê sem elas.
    let resposta = await consultar(`${COLUNAS_BASE}, episodio_id, queixa_rotulo`);
    if (resposta.error) resposta = await consultar(COLUNAS_BASE);
    const { data, error } = resposta;

    if (error) return err(toDomainError(error));

    const linhas = (data ?? []) as unknown as LinhaHistoricoDTO[];
    const interacoes = linhas.map((linha): InteracaoHistorico => {
      const sintomasDaTabela = Array.isArray(linha.sintomas_atendimento)
        ? linha.sintomas_atendimento[0]
        : linha.sintomas_atendimento;

      return {
        id: String(linha.id),
        quando: linha.created_at,
        descricao: linha.descricao_usuario ?? '',
        // Registros do pré-prontuário têm texto fixo no lugar do JSON da IA.
        triagem: interpretarResposta(linha.resposta_ia),
        sintomas: sintomasMarcados(sintomasDaTabela as Record<string, boolean> | null),
        episodioId: linha.episodio_id === null || linha.episodio_id === undefined ? null : String(linha.episodio_id),
        rotulo: linha.queixa_rotulo ?? null,
        recorrencia: lerRecorrencia(linha.resposta_ia),
      };
    });

    return ok(interacoes);
  }

  /** "Não é isso": o relato deixa de ser continuação e vira um episódio próprio. */
  async desvincularEpisodio(historicoId: string): Promise<Result<void, DomainError>> {
    const { error } = await this.supabase.from('historico_ia').update({ episodio_id: null }).eq('id', historicoId);
    if (error) return err(toDomainError(error));
    return ok(undefined);
  }
}

interface LinhaHistoricoDTO {
  id: number | string;
  created_at: string;
  descricao_usuario: string | null;
  resposta_ia: string | null;
  sintomas_atendimento: Record<string, boolean> | Record<string, boolean>[] | null;
  episodio_id?: number | string | null;
  queixa_rotulo?: string | null;
}

function lerRecorrencia(bruto: string | null): ItemRecorrencia[] {
  if (!bruto) return [];
  try {
    return paraRecorrencia((JSON.parse(bruto) as { recorrencia?: RecorrenciaDTO[] })?.recorrencia);
  } catch {
    return [];
  }
}

function paraAnalise(d: AnaliseDTO): AnaliseTriagem {
  const a = d.atualizacoes_ficha ?? {};
  return {
    triagem: paraTriagem(d),
    perguntas: (d.perguntas ?? []).filter((p) => typeof p?.pergunta === 'string' && p.pergunta.trim() !== ''),
    atualizacoes: {
      alergias: a.alergias ?? null,
      medicamentosEmUso: a.medicamentos_em_uso ?? null,
      doencasPreexistentes: a.doencas_preexistentes ?? null,
    },
    historicoId: d.historico_id === null || d.historico_id === undefined ? null : String(d.historico_id),
    rotulo: d.queixa_rotulo ?? null,
    episodioAnterior: d.episodio
      ? { id: String(d.episodio.id), desde: d.episodio.desde, rotulo: d.episodio.rotulo ?? null }
      : null,
    recorrencia: paraRecorrencia(d.recorrencia),
  };
}

function interpretarResposta(bruto: string | null): Triagem | null {
  if (!bruto) return null;
  try {
    const json = JSON.parse(bruto) as TriagemDTO;
    return typeof json?.nivel === 'number' ? paraTriagem(json) : null;
  } catch {
    return null;
  }
}

/** O FunctionsHttpError guarda o corpo da resposta; é onde está a mensagem útil. */
async function lerMensagem(error: unknown): Promise<string | null> {
  const contexto = (error as { context?: Response })?.context;
  if (!contexto || typeof contexto.json !== 'function') return null;
  try {
    const corpo = await contexto.json();
    return typeof corpo?.erro === 'string' ? corpo.erro : null;
  } catch {
    return null;
  }
}
