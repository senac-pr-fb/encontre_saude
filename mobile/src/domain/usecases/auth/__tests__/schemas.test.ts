import { emailSchema, senhaSchema, loginSchema, cadastroSchema, recuperarSenhaSchema, novaSenhaSchema } from '../schemas';

describe('emailSchema', () => {
  it('aceita e-mail válido e normaliza para minúsculas', () => {
    expect(emailSchema.parse('Usuario@Exemplo.com')).toBe('usuario@exemplo.com');
  });

  it('rejeita e-mail inválido', () => {
    expect(emailSchema.safeParse('não-é-email').success).toBe(false);
  });
});

describe('senhaSchema', () => {
  it('aceita senha com 6 ou mais caracteres', () => {
    expect(senhaSchema.safeParse('123456').success).toBe(true);
  });

  it('rejeita senha curta', () => {
    const result = senhaSchema.safeParse('123');
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('aceita email e senha válidos', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', senha: 'x' });
    expect(result.success).toBe(true);
  });

  it('rejeita senha vazia', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', senha: '' });
    expect(result.success).toBe(false);
  });
});

describe('cadastroSchema', () => {
  it('aceita quando as senhas coincidem', () => {
    const result = cadastroSchema.safeParse({ email: 'a@b.com', senha: '123456', confirmarSenha: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejeita quando as senhas não coincidem', () => {
    const result = cadastroSchema.safeParse({ email: 'a@b.com', senha: '123456', confirmarSenha: '654321' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmarSenha']);
    }
  });
});

describe('recuperarSenhaSchema', () => {
  it('aceita e-mail válido', () => {
    expect(recuperarSenhaSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });
});

describe('novaSenhaSchema', () => {
  it('rejeita quando as senhas não coincidem', () => {
    const result = novaSenhaSchema.safeParse({ senha: '123456', confirmarSenha: 'outra' });
    expect(result.success).toBe(false);
  });

  it('aceita quando as senhas coincidem', () => {
    const result = novaSenhaSchema.safeParse({ senha: '123456', confirmarSenha: '123456' });
    expect(result.success).toBe(true);
  });
});
