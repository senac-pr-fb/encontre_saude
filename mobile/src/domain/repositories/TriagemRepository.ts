import type { AnaliseTriagem, ComplementoTriagem, InteracaoHistorico } from '@domain/entities/Triagem';
import type { DomainError } from '@domain/errors';
import type { Result } from '@core/utils/result';

export interface TriagemRepository {
  /**
   * Chama a Edge Function, que fala com a IA e grava o historico. Com o
   * complemento, reanalisa com as respostas e atualiza o mesmo registro.
   */
  analisar(descricao: string, complemento?: ComplementoTriagem): Promise<Result<AnaliseTriagem, DomainError>>;
  historico(userId: string): Promise<Result<InteracaoHistorico[], DomainError>>;
  /** Desfaz a ligação feita pela IA: o relato vira um episódio próprio. */
  desvincularEpisodio(historicoId: string): Promise<Result<void, DomainError>>;
}
