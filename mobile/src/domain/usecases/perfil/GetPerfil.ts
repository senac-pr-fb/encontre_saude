import type { PerfilRepository } from '@domain/repositories/PerfilRepository';

export class GetPerfil {
  constructor(private readonly repo: PerfilRepository) {}
  execute(userId: string) {
    return this.repo.getByUserId(userId);
  }
}
