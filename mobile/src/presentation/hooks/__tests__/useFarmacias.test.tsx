import type { PropsWithChildren } from 'react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useFarmacias } from '../useFarmacias';
import { ok } from '@core/utils/result';
import { NetworkError } from '@domain/errors';
import type { Farmacia } from '@domain/entities/Farmacia';

jest.mock('@core/di/container', () => ({
  container: { farmacias: { listar: { execute: jest.fn() } } },
}));

const farmacia = (overrides: Partial<Farmacia>): Farmacia => ({
  id: '1',
  nome: 'Farmácia Central',
  endereco: null,
  bairro: 'Centro',
  telefone: null,
  horario: null,
  site: null,
  instagram: null,
  tipo: 'Municipal',
  lat: -26.08,
  lng: -53.05,
  ...overrides,
});

const lista: Farmacia[] = [
  farmacia({ id: '1', nome: 'Farmácia Central', bairro: 'Centro', tipo: 'Municipal' }),
  farmacia({ id: '2', nome: 'Drogaria Popular', bairro: 'Água Branca', tipo: 'Privada' }),
];

function criarWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useFarmacias', () => {
  it('carrega, expõe bairros derivados e mantém tudo visível sem filtro', async () => {
    (container.farmacias.listar.execute as jest.Mock).mockResolvedValue(ok(lista));

    const { result } = await renderHook(() => useFarmacias(), { wrapper: criarWrapper() });

    expect(result.current.carregando).toBe(true);
    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.todas).toEqual(lista);
    expect(result.current.visiveis).toEqual(lista);
    expect(result.current.bairros).toEqual(['Água Branca', 'Centro']);
    expect(result.current.erro).toBeNull();
  });

  it('setTermo filtra a lista visível', async () => {
    (container.farmacias.listar.execute as jest.Mock).mockResolvedValue(ok(lista));

    const { result } = await renderHook(() => useFarmacias(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.carregando).toBe(false));

    act(() => result.current.setTermo('central'));

    await waitFor(() => expect(result.current.visiveis).toHaveLength(1));
    expect(result.current.visiveis[0].id).toBe('1');
  });

  it('setBairro filtra pelo bairro exato', async () => {
    (container.farmacias.listar.execute as jest.Mock).mockResolvedValue(ok(lista));

    const { result } = await renderHook(() => useFarmacias(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.carregando).toBe(false));

    act(() => result.current.setBairro('Água Branca'));

    await waitFor(() => expect(result.current.visiveis).toHaveLength(1));
    expect(result.current.visiveis[0].id).toBe('2');
  });

  it('alternarTipo remove e readiciona um tipo do filtro', async () => {
    (container.farmacias.listar.execute as jest.Mock).mockResolvedValue(ok(lista));

    const { result } = await renderHook(() => useFarmacias(), { wrapper: criarWrapper() });
    await waitFor(() => expect(result.current.carregando).toBe(false));

    act(() => result.current.alternarTipo('Privada'));
    await waitFor(() => expect(result.current.visiveis).toHaveLength(1));
    expect(result.current.visiveis[0].tipo).toBe('Municipal');

    act(() => result.current.alternarTipo('Privada'));
    await waitFor(() => expect(result.current.visiveis).toHaveLength(2));
  });

  it('expõe a mensagem de erro quando o carregamento falha', async () => {
    (container.farmacias.listar.execute as jest.Mock).mockRejectedValue(new NetworkError());

    const { result } = await renderHook(() => useFarmacias(), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.erro).toBe('Sem conexão com o servidor'));
    expect(result.current.todas).toEqual([]);
  });
});
