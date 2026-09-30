import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useContextoSaude } from '../useContextoSaude';
import { ok } from '@core/utils/result';
import { perfilVazio } from '@domain/entities/PerfilSaude';

jest.mock('@core/di/container', () => ({
  container: {
    perfil: { get: { execute: jest.fn() }, save: { execute: jest.fn() } },
    triagem: { historico: { execute: jest.fn() } },
  },
}));
jest.mock('@presentation/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

function criarWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'user-1', email: 'a@b.com', nome: 'Maria' } });
});

describe('useContextoSaude', () => {
  it('não responde enquanto a ficha e o histórico carregam', async () => {
    (container.perfil.get.execute as jest.Mock).mockReturnValue(new Promise(() => {}));
    (container.triagem.historico.execute as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { result } = await renderHook(() => useContextoSaude(), { wrapper: criarWrapper() });

    expect(result.current.carregando).toBe(true);
    expect(result.current.contexto).toBeNull();
  });

  it('monta o contexto com a ficha, o nome da conta e o histórico', async () => {
    (container.perfil.get.execute as jest.Mock).mockResolvedValue(ok({ ...perfilVazio('user-1'), cpf: '12345678901' }));
    (container.triagem.historico.execute as jest.Mock).mockResolvedValue(ok([]));

    const { result } = await renderHook(() => useContextoSaude(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.contexto).not.toBeNull());
    expect(result.current.contexto?.fichaExiste).toBe(true);
    expect(result.current.contexto?.nome).toBe('Maria');
    expect(result.current.contexto?.situacao).toBe('sem-triagem');
    expect(result.current.contexto?.faltantes).not.toContain('cpf');
  });
});
