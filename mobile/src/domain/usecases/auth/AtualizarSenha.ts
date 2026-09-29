import type { AuthRepository, RecuperacaoSenhaRepository } from '@domain/repositories/AuthRepository';
import { novaSenhaSchema, type NovaSenhaInput } from './schemas';
import { AuthError, ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';

/**
 * Troca de senha só existe dentro da recuperação: a sessão veio do link do
 * e-mail, que já provou a posse da conta. Fora disso, trocar a senha sem pedir
 * a atual deixaria um celular desbloqueado ou uma sessão roubada tomar a conta.
 */
export class AtualizarSenha {
  constructor(
    private readonly repo: AuthRepository,
    private readonly recuperacao: RecuperacaoSenhaRepository,
  ) {}

  async execute(input: NovaSenhaInput) {
    const parsed = novaSenhaSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(new ValidationError(String(issue.path[0] ?? ''), issue.message));
    }

    if (!(await this.recuperacao.ativa())) {
      return err(new AuthError('Para trocar a senha, use "Esqueci minha senha" na tela de login.'));
    }

    const resultado = await this.repo.atualizarSenha(parsed.data.senha);
    if (resultado.ok) await this.recuperacao.limpar();
    return resultado;
  }
}
