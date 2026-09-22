import type { FarmaciaRepository } from '@domain/repositories/FarmaciaRepository';

export class ListarFarmacias {
  constructor(private readonly repo: FarmaciaRepository) {}
  execute() {
    return this.repo.listar();
  }
}
