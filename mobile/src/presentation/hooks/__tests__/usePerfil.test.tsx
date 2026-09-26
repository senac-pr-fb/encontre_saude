import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useAuth } from '@presentation/providers/AuthProvider';
import { usePerfil } from '../usePerfil';
import { ok } from '@core/utils/result';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';

jest.mock('@core/di/container', () => ({
  container: { perfil: { get: { execute: jest.fn() }, save: { execute: jest.fn() } } },
}));
jest.mock('@presentation/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

function criarWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('usePerfil', () => {
  it('carrega o perfil do usuário logado', async () => {
    (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'user-1', email: 'a@b.com', nome: null }, carregando: false });
    const perfil: PerfilSaude = { ...perfilVazio('user-1'), alergias: 'Poeira' };
    (container.perfil.get.execute as jest.Mock).mockResolvedValue(ok(perfil));

    const { result } = await renderHook(() => usePerfil(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(container.perfil.get.execute).toHaveBeenCalledWith('user-1');
    expect(result.current.perfil).toEqual(perfil);
    expect(result.current.existe).toBe(true);
  });

  it('devolve perfil null e não consulta quando não há usuário logado', async () => {
    (useAuth as jest.Mock).mockReturnValue({ usuario: null, carregando: false });

    const { result } = await renderHook(() => usePerfil(), { wrapper: criarWrapper() });

    expect(container.perfil.get.execute).not.toHaveBeenCalled();
    expect(result.current.perfil).toBeNull();
    expect(result.current.existe).toBe(false);
  });

  it('salvar chama o use case com o userId e atualiza o cache em caso de sucesso', async () => {
    (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'user-1', email: 'a@b.com', nome: null }, carregando: false });
    const perfilAtualizado: PerfilSaude = { ...perfilVazio('user-1'), idade: 30 };
    (container.perfil.get.execute as jest.Mock).mockResolvedValue(ok(perfilVazio('user-1')));
    (container.perfil.save.execute as jest.Mock).mockResolvedValue(ok(perfilAtualizado));

    const { result } = await renderHook(() => usePerfil(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.carregando).toBe(false));

    result.current.salvar.mutate({} as never);

    await waitFor(() => expect(result.current.salvar.isSuccess).toBe(true));
    expect(container.perfil.save.execute).toHaveBeenCalledWith('user-1', {});
  });
});
