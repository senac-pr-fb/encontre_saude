import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useAuthActions } from '../useAuthActions';
import { ok, err } from '@core/utils/result';
import { AuthError } from '@domain/errors';

jest.mock('@core/di/container', () => ({
  container: {
    auth: {
      signIn: { execute: jest.fn() },
      signUp: { execute: jest.fn() },
      signInWithGoogle: { execute: jest.fn() },
      signOut: { execute: jest.fn() },
      recuperarSenha: { execute: jest.fn() },
      atualizarSenha: { execute: jest.fn() },
    },
  },
}));

function criarWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useAuthActions', () => {
  it('signIn chama o use case e reflete sucesso na mutation', async () => {
    const usuario = { id: '1', email: 'a@b.com', nome: null };
    (container.auth.signIn.execute as jest.Mock).mockResolvedValue(ok(usuario));

    const { result } = await renderHook(() => useAuthActions(), { wrapper: criarWrapper() });
    result.current.signIn.mutate({ email: 'a@b.com', senha: '123456' });

    await waitFor(() => expect(result.current.signIn.isSuccess).toBe(true));
    expect(container.auth.signIn.execute).toHaveBeenCalledWith({ email: 'a@b.com', senha: '123456' });
    expect(result.current.signIn.data).toEqual(usuario);
  });

  it('signIn reflete erro na mutation quando o use case falha', async () => {
    (container.auth.signIn.execute as jest.Mock).mockResolvedValue(err(new AuthError('credenciais inválidas')));

    const { result } = await renderHook(() => useAuthActions(), { wrapper: criarWrapper() });
    result.current.signIn.mutate({ email: 'a@b.com', senha: 'errada' });

    await waitFor(() => expect(result.current.signIn.isError).toBe(true));
    expect(result.current.signIn.error).toEqual(new AuthError('credenciais inválidas'));
  });

  it('signOut chama o use case sem argumentos', async () => {
    (container.auth.signOut.execute as jest.Mock).mockResolvedValue(ok(undefined));

    const { result } = await renderHook(() => useAuthActions(), { wrapper: criarWrapper() });
    result.current.signOut.mutate();

    await waitFor(() => expect(result.current.signOut.isSuccess).toBe(true));
    expect(container.auth.signOut.execute).toHaveBeenCalledTimes(1);
  });

  it('expõe as seis mutations esperadas', async () => {
    const { result } = await renderHook(() => useAuthActions(), { wrapper: criarWrapper() });

    expect(Object.keys(result.current)).toEqual([
      'signIn',
      'signUp',
      'signInWithGoogle',
      'signOut',
      'recuperarSenha',
      'atualizarSenha',
    ]);
  });
});
