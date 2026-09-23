import type { SupabaseClient } from '@supabase/supabase-js';
import type { TriagemRepository } from '@domain/repositories/TriagemRepository';
import type { InteracaoHistorico, Triagem } from '@domain/entities/Triagem';
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
   * O prompt, a chave do Gemini e a gravação do histórico vivem na Edge
   * Function — nada disso entra no bundle. O supabase-js anexa o JWT do
   * usuário automaticamente, e a função recusa chamadas sem ele.
   */
  async analisar(descricao: string): Promise<Result<Triagem, DomainError>> {
    const { data, error } = await this.supabase.functions.invoke<TriagemDTO & { erro?: string }>('triagem', {
      body: { descricao },
    });

    if (error) {
      // O corpo de erro da função traz a mensagem em `erro`; o SDK só expõe o status.
      const detalhe = await lerMensagem(error);
      return err(new DomainError(detalhe ?? 'Não foi possível analisar os sintomas agora', 'TRIAGEM'));
    }
    if (!data || data.erro) {
      return err(new DomainError(data?.erro ?? 'Resposta vazia da triagem', 'TRIAGEM'));
    }

    return ok(paraTriagem(data));
  }

  async historico(userId: string): Promise<Result<InteracaoHistorico[], DomainError>> {
    const { data, error } = await this.supabase
      .from('historico_ia')
      .select('id, created_at, descricao_usuario, resposta_ia, sintomas_atendimento(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return err(toDomainError(error));

    const interacoes = (data ?? []).map((linha): InteracaoHistorico => {
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
      };
    });

    return ok(interacoes);
  }
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
