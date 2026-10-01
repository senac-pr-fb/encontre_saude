import type { TriagemRepository } from '@domain/repositories/TriagemRepository';

/**
 * "Não é isso": a pessoa discorda da IA, que ligou o relato a um anterior. O
 * relato passa a ser um episódio próprio — a queixa do documento deixa de
 * misturar os dois.
 */
export class DesvincularEpisodio {
  constructor(private readonly repo: TriagemRepository) {}

  execute(historicoId: string) {
    return this.repo.desvincularEpisodio(historicoId);
  }
}
