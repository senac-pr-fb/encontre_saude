import type { Farmacia } from '@domain/entities/Farmacia';
import type { DomainError } from '@domain/errors';
import type { Result } from '@core/utils/result';

export interface FarmaciaRepository {
  listar(): Promise<Result<Farmacia[], DomainError>>;
}
