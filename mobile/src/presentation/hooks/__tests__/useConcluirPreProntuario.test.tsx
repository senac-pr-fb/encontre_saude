import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useConcluirPreProntuario } from '../useConcluirPreProntuario';
import { ok } from '@core/utils/result';

jest.mock('@core/di/container', () => ({
  container: {
    prontuario: {
      rascunho: { limpar: jest.fn() },
      salvar: { execute: jest.fn() },
      pdf: { gerar: jest.fn() },
    },
    auth: { repo: { atualizarNome: jest.fn() } },
  },
}));
jest.mock('@presentation/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

const client = () => new QueryClient({ defaultOptions: { mutations: { retry: false } } });

function criarWrapper(qc: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const usuario = { id: 'user-1', email: 'a@b.com', nome: 'Fulano' };

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ usuario });
  (container.prontuario.salvar.execute as jest.Mock).mockResolvedValue(ok(undefined));
  (container.auth.repo.atualizarNome as jest.Mock).mockResolvedValue(ok(undefined));
  (container.prontuario.pdf.gerar as jest.Mock).mockResolvedValue({ uri: 'file:///doc.pdf', compartilhavel: true });
});

describe('useConcluirPreProntuario', () => {
  it('salva a consulta, atualiza o nome quando mudou, gera o PDF e limpa o rascunho', async () => {
    const { result } = await renderHook(() => useConcluirPreProntuario(), { wrapper: criarWrapper(client()) });

    const valores = { nome: 'Nome Novo', queixaPrincipal: 'Febre alta desde ontem' } as never;
    result.current.mutate({ valores });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(container.prontuario.salvar.execute).toHaveBeenCalledWith('user-1', expect.objectContaining(valores));
    expect(container.auth.repo.atualizarNome).toHaveBeenCalledWith('Nome Novo');
    expect(container.prontuario.pdf.gerar).toHaveBeenCalledWith(expect.objectContaining(valores));
    expect(container.prontuario.rascunho.limpar).toHaveBeenCalledTimes(1);
    expect(result.current.data?.pdf.uri).toBe('file:///doc.pdf');
  });

  it('não atualiza o nome quando ele não mudou em relação à conta', async () => {
    const { result } = await renderHook(() => useConcluirPreProntuario(), { wrapper: criarWrapper(client()) });

    result.current.mutate({ valores: { nome: 'Fulano' } as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(container.auth.repo.atualizarNome).not.toHaveBeenCalled();
  });

  it('invalida perfil e histórico para o contexto de saúde se recalcular', async () => {
    const qc = client();
    const invalidar = jest.spyOn(qc, 'invalidateQueries');
    const { result } = await renderHook(() => useConcluirPreProntuario(), { wrapper: criarWrapper(qc) });

    result.current.mutate({ valores: { nome: 'Fulano' } as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['perfil', 'user-1'] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['historico', 'user-1'] });
  });
});
