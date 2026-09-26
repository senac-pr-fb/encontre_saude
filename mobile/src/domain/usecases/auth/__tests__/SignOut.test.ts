import { SignOut } from '../SignOut';
import { ok, err } from '@core/utils/result';
import { AuthError } from '@domain/errors';
import type { AuthRepository } from '@domain/repositories/AuthRepository';

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

describe('SignOut', () => {
  it('delega diretamente ao repositório', async () => {
    const repo = criarRepoFake();
    repo.signOut.mockResolvedValue(ok(undefined));

    const resultado = await new SignOut(repo).execute();

    expect(repo.signOut).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual(ok(undefined));
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.signOut.mockResolvedValue(err(new AuthError('falha ao sair')));

    const resultado = await new SignOut(repo).execute();

    expect(resultado).toEqual(err(new AuthError('falha ao sair')));
  });
});
