import { SignOut } from '../SignOut';
import { ok, err } from '@core/utils/result';
import { AuthError } from '@domain/errors';
import type { AuthRepository } from '@domain/repositories/AuthRepository';
import type { LimpezaLocalService } from '@domain/services/LimpezaLocalService';

function criarRepoFake(): jest.Mocked<AuthRepository> {
  return {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    signInWithGoogle: jest.fn(),
    getUsuarioAtual: jest.fn(),
    onAuthStateChange: jest.fn(),
    enviarRecuperacaoSenha: jest.fn(),
    atualizarSenha: jest.fn(),
    atualizarNome: jest.fn(),
    iniciarAutoRefresh: jest.fn(),
    pararAutoRefresh: jest.fn(),
    restaurarSessaoDeLink: jest.fn(),
  };
}

function criarLimpezaFake(): jest.Mocked<LimpezaLocalService> {
  return { limpar: jest.fn().mockResolvedValue(undefined) };
}

describe('SignOut', () => {
  it('encerra a sessão e apaga os dados locais do usuário', async () => {
    const repo = criarRepoFake();
    const limpeza = criarLimpezaFake();
    repo.signOut.mockResolvedValue(ok(undefined));

    const resultado = await new SignOut(repo, limpeza).execute();

    expect(repo.signOut).toHaveBeenCalledTimes(1);
    expect(limpeza.limpar).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual(ok(undefined));
  });

  it('propaga o erro e mantém os dados locais quando o logout falha', async () => {
    const repo = criarRepoFake();
    const limpeza = criarLimpezaFake();
    repo.signOut.mockResolvedValue(err(new AuthError('falha ao sair')));

    const resultado = await new SignOut(repo, limpeza).execute();

    expect(resultado).toEqual(err(new AuthError('falha ao sair')));
    expect(limpeza.limpar).not.toHaveBeenCalled();
  });
});
