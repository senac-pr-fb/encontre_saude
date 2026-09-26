import { toAuthError, toDomainError } from '../errors';
import { AuthError, NetworkError, DomainError } from '@domain/errors';

describe('toAuthError', () => {
  it('traduz credenciais inválidas', () => {
    const erro = toAuthError({ message: 'Invalid login credentials' });
    expect(erro).toBeInstanceOf(AuthError);
    expect(erro.message).toBe('E-mail ou senha incorretos');
  });

  it('traduz e-mail já cadastrado', () => {
    const erro = toAuthError({ message: 'User already registered' });
    expect(erro.message).toBe('Este e-mail já está cadastrado');
  });

  it('traduz senha curta', () => {
    const erro = toAuthError({ message: 'Password should be at least 6 characters' });
    expect(erro.message).toBe('A senha precisa ter pelo menos 6 caracteres');
  });

  it('traduz rate limit', () => {
    const erro = toAuthError({ message: 'Too many requests' });
    expect(erro.message).toBe('Muitas tentativas. Aguarde um instante e tente de novo');
  });

  it('devolve NetworkError para falha de rede', () => {
    const erro = toAuthError({ message: 'Network request failed' });
    expect(erro).toBeInstanceOf(NetworkError);
  });

  it('devolve a mensagem original quando não há tradução conhecida', () => {
    const erro = toAuthError({ message: 'Erro desconhecido do Supabase' });
    expect(erro).toBeInstanceOf(AuthError);
    expect(erro.message).toBe('Erro desconhecido do Supabase');
  });
});

describe('toDomainError', () => {
  it('devolve NetworkError para falha de rede', () => {
    const erro = toDomainError({ message: 'fetch failed' });
    expect(erro).toBeInstanceOf(NetworkError);
  });

  it('usa o código informado quando presente', () => {
    const erro = toDomainError({ message: 'linha não encontrada', code: 'PGRST116' });
    expect(erro).toBeInstanceOf(DomainError);
    expect(erro.code).toBe('PGRST116');
    expect(erro.message).toBe('linha não encontrada');
  });

  it('usa o código SUPABASE quando nenhum código é informado', () => {
    const erro = toDomainError({ message: 'algo deu errado' });
    expect(erro.code).toBe('SUPABASE');
  });
});
