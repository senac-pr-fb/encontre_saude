import type { TriagemRepository } from '@domain/repositories/TriagemRepository';

export class GetHistorico {
  constructor(private readonly repo: TriagemRepository) {}
  execute(userId: string) {
    return this.repo.historico(userId);
  }
}
