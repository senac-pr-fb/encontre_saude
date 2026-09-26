import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useAuth } from '@presentation/providers/AuthProvider';
import { gerarPdfProntuario } from '@data/pdf/prontuarioPdf';
import { usePreProntuario } from '../usePreProntuario';
import { ok } from '@core/utils/result';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { TriagemRecente } from '@domain/entities/PreProntuario';

jest.mock('@core/di/container', () => ({
  container: {
    perfil: { get: { execute: jest.fn() }, save: { execute: jest.fn() } },
    prontuario: {
      rascunho: { carregar: jest.fn(), salvar: jest.fn(), limpar: jest.fn() },
      triagemLocal: { recente: jest.fn(), registrar: jest.fn() },
      salvar: { execute: jest.fn() },
    },
    auth: { repo: { atualizarNome: jest.fn() } },
  },
}));
jest.mock('@presentation/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@data/pdf/prontuarioPdf', () => ({
  gerarPdfProntuario: jest.fn(),
  imprimirProntuario: jest.fn(),
  compartilharPdf: jest.fn(),
}));

function criarWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const usuario = { id: 'user-1', email: 'a@b.com', nome: 'Fulano' };

beforeEach(() => {
  (useAuth as jest.Mock).mockReturnValue({ usuario, carregando: false });
  (container.perfil.get.execute as jest.Mock).mockResolvedValue(ok(null));
  (container.prontuario.rascunho.carregar as jest.Mock).mockResolvedValue(null);
  (container.prontuario.triagemLocal.recente as jest.Mock).mockResolvedValue(null);
});

describe('usePreProntuario — valores iniciais', () => {
  it('monta os valores iniciais a partir do nome do usuário quando não há rascunho nem triagem', async () => {
    const { result } = await renderHook(() => usePreProntuario(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.iniciais).not.toBeNull());
    expect(result.current.iniciais?.nome).toBe('Fulano');
    expect(result.current.iniciais?.queixaPrincipal).toBe('');
    expect(result.current.rascunhoRestaurado).toBe(false);
    expect(result.current.triagem).toBeNull();
  });

  it('mescla o rascunho salvo por cima dos dados do perfil e marca rascunhoRestaurado', async () => {
    (container.prontuario.rascunho.carregar as jest.Mock).mockResolvedValue({ nome: 'Rascunho Salvo' });

    const { result } = await renderHook(() => usePreProntuario(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.rascunhoRestaurado).toBe(true));
    expect(result.current.iniciais?.nome).toBe('Rascunho Salvo');
  });

  it('preenche a queixa principal com o resumo da triagem recente quando o campo está vazio', async () => {
    const recente: TriagemRecente = {
      textoUsuario: 'Estou com febre',
      nivel: 3,
      resumo: 'Sintomas significativos',
      recomendacao: 'Procure atendimento',
      quando: Date.now(),
    };
    (container.prontuario.triagemLocal.recente as jest.Mock).mockResolvedValue(recente);

    const { result } = await renderHook(() => usePreProntuario(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.triagem).toEqual(recente));
    expect(result.current.iniciais?.queixaPrincipal).toContain('Estou com febre');
    expect(result.current.iniciais?.queixaPrincipal).toContain('Sintomas significativos');
  });

  it('usa os dados do perfil salvo quando existem', async () => {
    const perfil: PerfilSaude = { ...perfilVazio('user-1'), peso: 70, cpf: '12345678901' };
    (container.perfil.get.execute as jest.Mock).mockResolvedValue(ok(perfil));

    const { result } = await renderHook(() => usePreProntuario(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.iniciais).not.toBeNull());
    expect(result.current.iniciais?.peso).toBe('70');
    expect(result.current.iniciais?.cpf).toBe('12345678901');
  });
});

describe('usePreProntuario — salvarRascunho', () => {
  it('delega ao repositório de rascunho local', async () => {
    const { result } = await renderHook(() => usePreProntuario(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.iniciais).not.toBeNull());

    result.current.salvarRascunho({ ...result.current.iniciais!, nome: 'Editado' });

    expect(container.prontuario.rascunho.salvar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Editado' }),
    );
  });
});

describe('usePreProntuario — concluir', () => {
  it('salva a consulta, atualiza o nome quando mudou, gera o PDF e limpa o rascunho', async () => {
    (container.prontuario.salvar.execute as jest.Mock).mockResolvedValue(ok(undefined));
    (container.auth.repo.atualizarNome as jest.Mock).mockResolvedValue(ok(undefined));
    (gerarPdfProntuario as jest.Mock).mockResolvedValue({ uri: 'file:///doc.pdf', compartilhavel: true });

    const { result } = await renderHook(() => usePreProntuario(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.iniciais).not.toBeNull());

    const valores = { ...result.current.iniciais!, nome: 'Nome Novo' } as never;
    result.current.concluir.mutate(valores);

    await waitFor(() => expect(result.current.concluir.isSuccess).toBe(true));
    expect(container.prontuario.salvar.execute).toHaveBeenCalledWith('user-1', valores);
    expect(container.auth.repo.atualizarNome).toHaveBeenCalledWith('Nome Novo');
    expect(gerarPdfProntuario).toHaveBeenCalledWith(valores);
    expect(container.prontuario.rascunho.limpar).toHaveBeenCalledTimes(1);
  });

  it('não atualiza o nome quando ele não mudou em relação à conta', async () => {
    (container.prontuario.salvar.execute as jest.Mock).mockResolvedValue(ok(undefined));
    (gerarPdfProntuario as jest.Mock).mockResolvedValue({ uri: 'file:///doc.pdf', compartilhavel: true });

    const { result } = await renderHook(() => usePreProntuario(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.iniciais).not.toBeNull());

    const valores = { ...result.current.iniciais!, nome: usuario.nome } as never;
    result.current.concluir.mutate(valores);

    await waitFor(() => expect(result.current.concluir.isSuccess).toBe(true));
    expect(container.auth.repo.atualizarNome).not.toHaveBeenCalled();
  });
});
