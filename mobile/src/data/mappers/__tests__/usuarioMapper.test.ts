import type { User } from '@supabase/supabase-js';
import { usuarioMapper } from '../usuarioMapper';

const criarUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'usuario@exemplo.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }) as User;

describe('usuarioMapper.toEntity', () => {
  it('converte id e email diretamente', () => {
    const entidade = usuarioMapper.toEntity(criarUser());
    expect(entidade.id).toBe('user-1');
    expect(entidade.email).toBe('usuario@exemplo.com');
  });

  it('usa string vazia quando o email está ausente', () => {
    const entidade = usuarioMapper.toEntity(criarUser({ email: undefined }));
    expect(entidade.email).toBe('');
  });

  it('lê o nome de user_metadata.full_name (preenchido pelo Google)', () => {
    const entidade = usuarioMapper.toEntity(criarUser({ user_metadata: { full_name: 'Fulano da Silva' } }));
    expect(entidade.nome).toBe('Fulano da Silva');
  });

  it('usa user_metadata.name como alternativa quando full_name não existe', () => {
    const entidade = usuarioMapper.toEntity(criarUser({ user_metadata: { name: 'Beltrano' } }));
    expect(entidade.nome).toBe('Beltrano');
  });

  it('devolve null quando não há nome em user_metadata (cadastro por e-mail)', () => {
    const entidade = usuarioMapper.toEntity(criarUser({ user_metadata: {} }));
    expect(entidade.nome).toBeNull();
  });
});
