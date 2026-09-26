import { DomainError, AuthError, ValidationError, NetworkError, NotFoundError } from '../DomainError';

describe('DomainError', () => {
  it('guarda mensagem e código, e é uma instância de Error', () => {
    const error = new DomainError('mensagem qualquer', 'CODIGO');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('mensagem qualquer');
    expect(error.code).toBe('CODIGO');
    expect(error.name).toBe('DomainError');
  });
});

describe('AuthError', () => {
  it('usa o código AUTH', () => {
    const error = new AuthError('não autenticado');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe('AUTH');
    expect(error.name).toBe('AuthError');
    expect(error.message).toBe('não autenticado');
  });
});

describe('ValidationError', () => {
  it('guarda o campo e usa o código VALIDATION', () => {
    const error = new ValidationError('email', 'e-mail inválido');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe('VALIDATION');
    expect(error.field).toBe('email');
    expect(error.name).toBe('ValidationError');
  });
});

describe('NetworkError', () => {
  it('usa mensagem padrão quando nenhuma é informada', () => {
    const error = new NetworkError();
    expect(error.code).toBe('NETWORK');
    expect(error.message).toBe('Sem conexão com o servidor');
    expect(error.name).toBe('NetworkError');
  });

  it('aceita mensagem customizada', () => {
    const error = new NetworkError('timeout');
    expect(error.message).toBe('timeout');
  });
});

describe('NotFoundError', () => {
  it('usa mensagem padrão quando nenhuma é informada', () => {
    const error = new NotFoundError();
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Registro não encontrado');
    expect(error.name).toBe('NotFoundError');
  });
});
