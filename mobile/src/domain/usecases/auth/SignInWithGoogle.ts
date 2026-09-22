import type { AuthRepository } from '@domain/repositories/AuthRepository';

export class SignInWithGoogle {
  constructor(private readonly repo: AuthRepository) {}
  execute() {
    return this.repo.signInWithGoogle();
  }
}
