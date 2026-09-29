import type { LimpezaLocalService } from '@domain/services/LimpezaLocalService';

/**
 * Limpeza avulsa, para quando a sessão acaba sem passar pelo SignOut
 * (refresh token revogado ou expirado, logout feito em outro aparelho).
 */
export class LimparDadosLocais {
  constructor(private readonly limpeza: LimpezaLocalService) {}

  execute() {
    return this.limpeza.limpar();
  }
}
