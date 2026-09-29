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

  it('devolve mensagem genérica quando não há tradução conhecida, sem expor o texto do Supabase', () => {
    const erro = toAuthError({ message: 'Database error saving new user: relation "profiles" does not exist' });
    expect(erro).toBeInstanceOf(AuthError);
    expect(erro.message).toBe('Não foi possível concluir a operação. Tente novamente.');
  });

  it('traduz senha fraca', () => {
    const erro = toAuthError({ message: 'Password is known to be weak and easy to guess' });
    expect(erro.message).toBe('Escolha uma senha mais forte');
  });
});

describe('toDomainError', () => {
  it('devolve NetworkError para falha de rede', () => {
    const erro = toDomainError({ message: 'fetch failed' });
    expect(erro).toBeInstanceOf(NetworkError);
  });

  it('mantém o código informado, mas troca o texto cru por mensagem genérica', () => {
    const erro = toDomainError({
      message: 'new row violates row-level security policy for table "dados_saude"',
      code: '42501',
    });
    expect(erro).toBeInstanceOf(DomainError);
    expect(erro.code).toBe('42501');
    expect(erro.message).toBe('Não foi possível acessar seus dados agora. Tente novamente.');
  });

  it('usa o código SUPABASE quando nenhum código é informado', () => {
    const erro = toDomainError({ message: 'algo deu errado' });
    expect(erro.code).toBe('SUPABASE');
  });
});
