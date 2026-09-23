import type { InteracaoHistorico, Triagem } from '@domain/entities/Triagem';
import type { DomainError } from '@domain/errors';
import type { Result } from '@core/utils/result';

export interface TriagemRepository {
  /** Chama a Edge Function, que fala com a IA e grava o historico. */
  analisar(descricao: string): Promise<Result<Triagem, DomainError>>;
  historico(userId: string): Promise<Result<InteracaoHistorico[], DomainError>>;
}
