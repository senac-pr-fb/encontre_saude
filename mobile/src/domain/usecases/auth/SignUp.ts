import type { AuthRepository } from '@domain/repositories/AuthRepository';
import { cadastroSchema, type CadastroInput } from './schemas';
import { ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';

export class SignUp {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: CadastroInput) {
    const parsed = cadastroSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(new ValidationError(String(issue.path[0] ?? ''), issue.message));
    }
    return this.repo.signUp(parsed.data.email, parsed.data.senha);
  }
}
