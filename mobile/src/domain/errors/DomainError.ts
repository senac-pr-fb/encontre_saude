export class DomainError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class AuthError extends DomainError {
  constructor(message: string) {
    super(message, 'AUTH');
    this.name = 'AuthError';
  }
}

export class ValidationError extends DomainError {
  constructor(readonly field: string, message: string) {
    super(message, 'VALIDATION');
    this.name = 'ValidationError';
  }
}

export class NetworkError extends DomainError {
  constructor(message = 'Sem conexão com o servidor') {
    super(message, 'NETWORK');
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Registro não encontrado') {
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
