import type { PerfilRepository } from '@domain/repositories/PerfilRepository';
import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import { ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';
import { perfilSchema, type PerfilFormInput } from './perfilSchema';

export class SavePerfil {
  constructor(private readonly repo: PerfilRepository) {}

  /**
   * Valida os dados do formulario e grava a ficha inteira.
   * Diferente do site, envia todos os campos da tabela: la o formulario
   * cobre 10 colunas mas o upsert manda 20, zerando o que nao esta na tela.
   */
  async execute(userId: string, entrada: PerfilFormInput) {
    const parsed = perfilSchema.safeParse(entrada);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(new ValidationError(issue.path.join('.'), issue.message));
    }

    const perfil: PerfilSaude = { userId, ...parsed.data };
    return this.repo.upsert(perfil);
  }
}
