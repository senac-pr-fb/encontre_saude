import { SignInWithGoogle } from '../SignInWithGoogle';
import { ok, err } from '@core/utils/result';
import { AuthError } from '@domain/errors';
import type { AuthRepository } from '@domain/repositories/AuthRepository';
import type { Usuario } from '@domain/entities/Usuario';

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

describe('SignInWithGoogle', () => {
  it('delega diretamente ao repositório', async () => {
    const repo = criarRepoFake();
    const usuario: Usuario = { id: '1', email: 'a@b.com', nome: 'Fulano' };
    repo.signInWithGoogle.mockResolvedValue(ok(usuario));

    const resultado = await new SignInWithGoogle(repo).execute();

    expect(repo.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual(ok(usuario));
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.signInWithGoogle.mockResolvedValue(err(new AuthError('login cancelado')));

    const resultado = await new SignInWithGoogle(repo).execute();

    expect(resultado).toEqual(err(new AuthError('login cancelado')));
  });
});
