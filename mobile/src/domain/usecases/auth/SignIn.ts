import type { AuthRepository } from '@domain/repositories/AuthRepository';
import { loginSchema, type LoginInput } from './schemas';
import { ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';

export class SignIn {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: LoginInput) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(new ValidationError(String(issue.path[0] ?? ''), issue.message));
    }
    return this.repo.signIn(parsed.data.email, parsed.data.senha);
  }
}
