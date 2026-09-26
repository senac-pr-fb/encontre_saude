import { SignIn } from '../SignIn';
import { ValidationError, AuthError } from '@domain/errors';
import { ok, err } from '@core/utils/result';
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

describe('SignIn', () => {
  it('delega ao repositório quando os dados são válidos', async () => {
    const repo = criarRepoFake();
    const usuario: Usuario = { id: '1', email: 'a@b.com', nome: null };
    repo.signIn.mockResolvedValue(ok(usuario));

    const resultado = await new SignIn(repo).execute({ email: 'a@b.com', senha: '123456' });

    expect(repo.signIn).toHaveBeenCalledWith('a@b.com', '123456');
    expect(resultado).toEqual(ok(usuario));
  });

  it('retorna erro de validação sem chamar o repositório quando o e-mail é inválido', async () => {
    const repo = criarRepoFake();

    const resultado = await new SignIn(repo).execute({ email: 'invalido', senha: '123456' });

    expect(repo.signIn).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
  });

  it('propaga o erro de autenticação vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.signIn.mockResolvedValue(err(new AuthError('credenciais inválidas')));

    const resultado = await new SignIn(repo).execute({ email: 'a@b.com', senha: '123456' });

    expect(resultado).toEqual(err(new AuthError('credenciais inválidas')));
  });
});
