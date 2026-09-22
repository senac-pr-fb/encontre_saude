import type { User } from '@supabase/supabase-js';
import type { Usuario } from '@domain/entities/Usuario';

export const usuarioMapper = {
  toEntity(u: User): Usuario {
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    const nome = (meta.full_name ?? meta.name) as string | undefined;
    return { id: u.id, email: u.email ?? '', nome: nome ?? null };
  },
};
