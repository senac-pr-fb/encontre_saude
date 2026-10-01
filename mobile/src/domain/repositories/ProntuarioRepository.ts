import type { PreProntuario } from '@domain/entities/PreProntuario';
import type { DomainError } from '@domain/errors';
import type { Result } from '@core/utils/result';

export interface ProntuarioRepository {
  /** Grava a consulta em historico_ia + sintomas_atendimento, como o site faz. */
  salvarConsulta(userId: string, prontuario: PreProntuario): Promise<Result<void, DomainError>>;
}

/** Armazenamento local do rascunho do formulario. */
export interface RascunhoRepository<T> {
  carregar(): Promise<T | null>;
  salvar(valor: T): Promise<void>;
  limpar(): Promise<void>;
}
