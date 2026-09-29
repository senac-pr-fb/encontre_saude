import type { AuthRepository } from '@domain/repositories/AuthRepository';
import type { LimpezaLocalService } from '@domain/services/LimpezaLocalService';

export class SignOut {
  constructor(
    private readonly repo: AuthRepository,
    private readonly limpeza: LimpezaLocalService,
  ) {}

  async execute() {
    const resultado = await this.repo.signOut();
    // Só limpa se a sessão realmente acabou: com erro de rede o usuário continua
    // logado e ainda precisa do rascunho.
    if (resultado.ok) await this.limpeza.limpar();
    return resultado;
  }
}
