import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useTriagem } from '../useTriagem';
import { ok } from '@core/utils/result';
import type { InteracaoHistorico, Triagem } from '@domain/entities/Triagem';

jest.mock('@core/di/container', () => ({
  container: { triagem: { historico: { execute: jest.fn() }, realizar: { execute: jest.fn() } } },
}));
jest.mock('@presentation/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

function criarWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const historico: InteracaoHistorico[] = [
  { id: '1', quando: '2024-01-01', descricao: 'Dor', triagem: null, sintomas: [] },
];

const triagem: Triagem = {
  nivel: 3,
  resumo: 'r',
  recomendacao: 'rec',
  primeirosSocorros: 'ps',
  unidadeRecomendada: 'UPA',
  sintomas: ['febre'],
};

describe('useTriagem', () => {
  it('carrega o histórico do usuário logado', async () => {
    (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'user-1', email: 'a@b.com', nome: null }, carregando: false });
    (container.triagem.historico.execute as jest.Mock).mockResolvedValue(ok(historico));

    const { result } = await renderHook(() => useTriagem(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.carregandoHistorico).toBe(false));
    expect(container.triagem.historico.execute).toHaveBeenCalledWith('user-1');
    expect(result.current.historico).toEqual(historico);
  });

  it('não consulta o histórico quando não há usuário logado', async () => {
    (useAuth as jest.Mock).mockReturnValue({ usuario: null, carregando: false });

    const { result } = await renderHook(() => useTriagem(), { wrapper: criarWrapper() });

    expect(container.triagem.historico.execute).not.toHaveBeenCalled();
    expect(result.current.historico).toEqual([]);
  });

  it('analisar chama o use case e invalida o histórico ao terminar', async () => {
    (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'user-1', email: 'a@b.com', nome: null }, carregando: false });
    (container.triagem.historico.execute as jest.Mock).mockResolvedValue(ok(historico));
    (container.triagem.realizar.execute as jest.Mock).mockResolvedValue(ok(triagem));

    const { result } = await renderHook(() => useTriagem(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.carregandoHistorico).toBe(false));

    result.current.analisar.mutate('Estou com febre há dois dias');

    await waitFor(() => expect(result.current.analisar.isSuccess).toBe(true));
    expect(container.triagem.realizar.execute).toHaveBeenCalledWith('Estou com febre há dois dias');
    // onSuccess invalida a query; o mock de historico é chamado de novo ao refetch.
    await waitFor(() => expect((container.triagem.historico.execute as jest.Mock).mock.calls.length).toBeGreaterThan(1));
  });
});
