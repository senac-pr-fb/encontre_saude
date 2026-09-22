import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import type { DomainError } from '@domain/errors';
import type { Result } from '@core/utils/result';

export interface PerfilRepository {
  /** null quando o usuario ainda nao preencheu a ficha. */
  getByUserId(userId: string): Promise<Result<PerfilSaude | null, DomainError>>;
  upsert(perfil: PerfilSaude): Promise<Result<PerfilSaude, DomainError>>;
}
