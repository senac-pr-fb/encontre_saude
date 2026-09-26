import { SignUp } from '../SignUp';
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

describe('SignUp', () => {
  it('delega ao repositório quando os dados são válidos', async () => {
    const repo = criarRepoFake();
    const usuario: Usuario = { id: '1', email: 'a@b.com', nome: null };
    repo.signUp.mockResolvedValue(ok({ usuario, precisaConfirmarEmail: true }));

    const resultado = await new SignUp(repo).execute({
      email: 'a@b.com',
      senha: '123456',
      confirmarSenha: '123456',
    });

    expect(repo.signUp).toHaveBeenCalledWith('a@b.com', '123456');
    expect(resultado).toEqual(ok({ usuario, precisaConfirmarEmail: true }));
  });

  it('retorna erro de validação quando as senhas não coincidem', async () => {
    const repo = criarRepoFake();

    const resultado = await new SignUp(repo).execute({
      email: 'a@b.com',
      senha: '123456',
      confirmarSenha: 'outra123',
    });

    expect(repo.signUp).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error).toBeInstanceOf(ValidationError);
      expect((resultado.error as ValidationError).field).toBe('confirmarSenha');
    }
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.signUp.mockResolvedValue(err(new AuthError('e-mail já cadastrado')));

    const resultado = await new SignUp(repo).execute({
      email: 'a@b.com',
      senha: '123456',
      confirmarSenha: '123456',
    });

    expect(resultado).toEqual(err(new AuthError('e-mail já cadastrado')));
  });
});
