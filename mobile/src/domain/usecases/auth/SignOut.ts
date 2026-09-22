import type { AuthRepository } from '@domain/repositories/AuthRepository';

export class SignOut {
  constructor(private readonly repo: AuthRepository) {}
  execute() {
    return this.repo.signOut();
  }
}
