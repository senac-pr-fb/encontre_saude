import { RecuperarSenha } from '../RecuperarSenha';
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

describe('RecuperarSenha', () => {
  it('delega ao repositório quando o e-mail é válido', async () => {
    const repo = criarRepoFake();
    repo.enviarRecuperacaoSenha.mockResolvedValue(ok(undefined));

    const resultado = await new RecuperarSenha(repo).execute({ email: 'a@b.com' });

    expect(repo.enviarRecuperacaoSenha).toHaveBeenCalledWith('a@b.com');
    expect(resultado).toEqual(ok(undefined));
  });

  it('retorna erro de validação sem chamar o repositório quando o e-mail é inválido', async () => {
    const repo = criarRepoFake();

    const resultado = await new RecuperarSenha(repo).execute({ email: 'invalido' });

    expect(repo.enviarRecuperacaoSenha).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.enviarRecuperacaoSenha.mockResolvedValue(err(new AuthError('falha ao enviar e-mail')));

    const resultado = await new RecuperarSenha(repo).execute({ email: 'a@b.com' });

    expect(resultado).toEqual(err(new AuthError('falha ao enviar e-mail')));
  });
});
