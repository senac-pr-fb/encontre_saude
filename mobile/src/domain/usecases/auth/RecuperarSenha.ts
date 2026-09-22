import type { AuthRepository } from '@domain/repositories/AuthRepository';
import { recuperarSenhaSchema, type RecuperarSenhaInput } from './schemas';
import { ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';

export class RecuperarSenha {
  constructor(private readonly repo: AuthRepository) {}

  async execute(input: RecuperarSenhaInput) {
    const parsed = recuperarSenhaSchema.safeParse(input);
    if (!parsed.success) return err(new ValidationError('email', parsed.error.issues[0].message));
    return this.repo.enviarRecuperacaoSenha(parsed.data.email);
  }
}
