import { AppState, Text } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { AuthProvider, useAuth } from '../AuthProvider';
import { ok } from '@core/utils/result';

jest.mock('@core/di/container', () => ({
  container: {
    auth: {
      repo: {
        getUsuarioAtual: jest.fn(),
        onAuthStateChange: jest.fn(),
        restaurarSessaoDeLink: jest.fn(),
        iniciarAutoRefresh: jest.fn(),
        pararAutoRefresh: jest.fn(),
      },
    },
  },
}));

const mockUseURL = jest.fn();
jest.mock('expo-linking', () => ({ useURL: () => mockUseURL() }));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const { repo } = container.auth;

function Consumidor() {
  const { usuario, carregando } = useAuth();
  return <Text>{carregando ? 'carregando' : usuario ? `logado:${usuario.id}` : 'deslogado'}</Text>;
}

beforeEach(() => {
  mockUseURL.mockReturnValue(null);
  (repo.getUsuarioAtual as jest.Mock).mockResolvedValue(null);
  (repo.onAuthStateChange as jest.Mock).mockReturnValue(jest.fn());
  (repo.restaurarSessaoDeLink as jest.Mock).mockResolvedValue(ok(null));
});

describe('AuthProvider', () => {
  it('mostra deslogado quando não há sessão persistida', async () => {
    await render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('deslogado')).toBeTruthy());
  });

  it('mostra o usuário logado quando há sessão persistida', async () => {
    (repo.getUsuarioAtual as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'a@b.com', nome: null });

    await render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('logado:user-1')).toBeTruthy());
  });

  it('atualiza o usuário quando o evento de autenticação dispara', async () => {
    let callback: ((u: unknown) => void) | undefined;
    (repo.onAuthStateChange as jest.Mock).mockImplementation((cb: (u: unknown) => void) => {
      callback = cb;
      return jest.fn();
    });

    await render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('deslogado')).toBeTruthy());

    await act(() => callback?.({ id: 'user-2', email: 'c@d.com', nome: null }));

    await waitFor(() => expect(screen.getByText('logado:user-2')).toBeTruthy());
  });

  it('redireciona para /nova-senha quando o deep link é de recuperação de senha', async () => {
    mockUseURL.mockReturnValue('encontresaude:///nova-senha#access_token=a&refresh_token=b&type=recovery');
    (repo.restaurarSessaoDeLink as jest.Mock).mockResolvedValue(ok('recuperacao'));

    await render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/nova-senha'));
  });

  it('não redireciona quando o link restaurado é apenas de login', async () => {
    mockUseURL.mockReturnValue('encontresaude:///login#access_token=a&refresh_token=b&type=login');
    (repo.restaurarSessaoDeLink as jest.Mock).mockResolvedValue(ok('login'));

    await render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );
    await waitFor(() => expect(repo.restaurarSessaoDeLink).toHaveBeenCalled());

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('inicia e para o auto-refresh conforme o app fica ativo/em segundo plano', async () => {
    let listener: ((state: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_evento, cb) => {
      listener = cb as (state: string) => void;
      return { remove: jest.fn() } as never;
    });

    await render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    );

    await act(() => listener?.('active'));
    expect(repo.iniciarAutoRefresh).toHaveBeenCalledTimes(1);

    await act(() => listener?.('background'));
    expect(repo.pararAutoRefresh).toHaveBeenCalledTimes(1);

    (AppState.addEventListener as jest.Mock).mockRestore();
  });
});
