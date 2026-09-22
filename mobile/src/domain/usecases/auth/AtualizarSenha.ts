import type { AuthRepository } from '@domain/repositories/AuthRepository';
import { novaSenhaSchema, type NovaSenhaInput } from './schemas';
import { ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';

export class AtualizarSenha {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: NovaSenhaInput) {
    const parsed = novaSenhaSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(new ValidationError(String(issue.path[0] ?? ''), issue.message));
    }
    return this.repo.atualizarSenha(parsed.data.senha);
  }
}
