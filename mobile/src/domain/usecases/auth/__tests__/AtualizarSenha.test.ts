import { AtualizarSenha } from '../AtualizarSenha';
import { ValidationError, AuthError } from '@domain/errors';
import { ok, err } from '@core/utils/result';
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

describe('AtualizarSenha', () => {
  it('delega ao repositório quando as senhas coincidem', async () => {
    const repo = criarRepoFake();
    repo.atualizarSenha.mockResolvedValue(ok(undefined));

    const resultado = await new AtualizarSenha(repo).execute({ senha: '123456', confirmarSenha: '123456' });

    expect(repo.atualizarSenha).toHaveBeenCalledWith('123456');
    expect(resultado).toEqual(ok(undefined));
  });

  it('retorna erro de validação sem chamar o repositório quando as senhas não coincidem', async () => {
    const repo = criarRepoFake();

    const resultado = await new AtualizarSenha(repo).execute({ senha: '123456', confirmarSenha: 'outra123' });

    expect(repo.atualizarSenha).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.atualizarSenha.mockResolvedValue(err(new AuthError('sessão expirada')));

    const resultado = await new AtualizarSenha(repo).execute({ senha: '123456', confirmarSenha: '123456' });

    expect(resultado).toEqual(err(new AuthError('sessão expirada')));
  });
});
