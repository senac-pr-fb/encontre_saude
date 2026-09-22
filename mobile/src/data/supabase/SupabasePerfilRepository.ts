import type { SupabaseClient } from '@supabase/supabase-js';
import type { PerfilRepository } from '@domain/repositories/PerfilRepository';
import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import type { DomainError } from '@domain/errors';
import { ok, err, type Result } from '@core/utils/result';
import { perfilMapper } from '@data/mappers/perfilMapper';
import { toDomainError } from './errors';

/** Código retornado pelo PostgREST quando `.single()` não encontra linha. */
const SEM_LINHA = 'PGRST116';

export class SupabasePerfilRepository implements PerfilRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getByUserId(userId: string): Promise<Result<PerfilSaude | null, DomainError>> {
    const { data, error } = await this.supabase
      .from('dados_saude')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== SEM_LINHA) return err(toDomainError(error));
    return ok(data ? perfilMapper.toEntity(data) : null);
  }

  async upsert(perfil: PerfilSaude): Promise<Result<PerfilSaude, DomainError>> {
    const { data, error } = await this.supabase
      .from('dados_saude')
      .upsert(perfilMapper.toDTO(perfil), { onConflict: 'user_id' })
      .select()
      .single();

    if (error) return err(toDomainError(error));
    return ok(perfilMapper.toEntity(data));
  }
}
