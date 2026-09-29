import { AtualizarSenha } from '../AtualizarSenha';
import { ValidationError, AuthError } from '@domain/errors';
import { ok, err } from '@core/utils/result';
import type { AuthRepository, RecuperacaoSenhaRepository } from '@domain/repositories/AuthRepository';

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

function criarRecuperacaoFake(ativa = true): jest.Mocked<RecuperacaoSenhaRepository> {
  return {
    ativa: jest.fn().mockResolvedValue(ativa),
    marcar: jest.fn().mockResolvedValue(undefined),
    limpar: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AtualizarSenha', () => {
  it('delega ao repositório e encerra a recuperação quando as senhas coincidem', async () => {
    const repo = criarRepoFake();
    const recuperacao = criarRecuperacaoFake();
    repo.atualizarSenha.mockResolvedValue(ok(undefined));

    const resultado = await new AtualizarSenha(repo, recuperacao).execute({ senha: '123456', confirmarSenha: '123456' });

    expect(repo.atualizarSenha).toHaveBeenCalledWith('123456');
    expect(recuperacao.limpar).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual(ok(undefined));
  });

  it('retorna erro de validação sem chamar o repositório quando as senhas não coincidem', async () => {
    const repo = criarRepoFake();

    const resultado = await new AtualizarSenha(repo, criarRecuperacaoFake()).execute({
      senha: '123456',
      confirmarSenha: 'outra123',
    });

    expect(repo.atualizarSenha).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
  });

  it('recusa a troca fora de uma recuperação de senha', async () => {
    const repo = criarRepoFake();

    const resultado = await new AtualizarSenha(repo, criarRecuperacaoFake(false)).execute({
      senha: '123456',
      confirmarSenha: '123456',
    });

    expect(repo.atualizarSenha).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(AuthError);
  });

  it('propaga o erro vindo do repositório e mantém a recuperação ativa', async () => {
    const repo = criarRepoFake();
    const recuperacao = criarRecuperacaoFake();
    repo.atualizarSenha.mockResolvedValue(err(new AuthError('sessão expirada')));

    const resultado = await new AtualizarSenha(repo, recuperacao).execute({ senha: '123456', confirmarSenha: '123456' });

    expect(resultado).toEqual(err(new AuthError('sessão expirada')));
    expect(recuperacao.limpar).not.toHaveBeenCalled();
  });
});
