import { render, screen, fireEvent } from '@testing-library/react-native';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useContextoSaude } from '@presentation/hooks/useContextoSaude';
import { BotaoPerfil } from '../BotaoPerfil';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@presentation/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@presentation/hooks/useContextoSaude', () => ({ useContextoSaude: jest.fn() }));

beforeEach(() => {
  mockPush.mockClear();
  (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'u', email: 'maria@x.com', nome: 'maria souza', foto: null } });
  (useContextoSaude as jest.Mock).mockReturnValue({ contexto: { faltantes: [] } });
});

describe('BotaoPerfil', () => {
  it('mostra o ícone de usuário quando a conta não tem foto e abre o perfil', async () => {
    await render(<BotaoPerfil />);
    expect(screen.getByTestId('perfil-icone')).toBeTruthy();
    expect(screen.queryByTestId('perfil-foto')).toBeNull();

    await fireEvent.press(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/perfil');
  });

  it('reaproveita a foto da conta Google', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: { id: 'u', email: 'joao@x.com', nome: 'João', foto: 'https://foto/j.jpg' },
    });
    await render(<BotaoPerfil />);
    expect(screen.getByTestId('perfil-foto').props.source).toEqual({ uri: 'https://foto/j.jpg' });
  });

  it('volta para o ícone quando a foto não carrega', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: { id: 'u', email: 'joao@x.com', nome: 'João', foto: 'https://foto/j.jpg' },
    });
    await render(<BotaoPerfil />);
    await fireEvent(screen.getByTestId('perfil-foto'), 'error');
    expect(screen.getByTestId('perfil-icone')).toBeTruthy();
  });

  it('sinaliza quando faltam dados obrigatórios na ficha', async () => {
    (useContextoSaude as jest.Mock).mockReturnValue({ contexto: { faltantes: ['cpf'] } });
    await render(<BotaoPerfil />);
    expect(screen.getByTestId('perfil-pendente')).toBeTruthy();
    expect(screen.getByLabelText('Abrir perfil. Há dados da ficha para completar')).toBeTruthy();
  });

  it('não sinaliza enquanto o contexto carrega', async () => {
    (useContextoSaude as jest.Mock).mockReturnValue({ contexto: null });
    await render(<BotaoPerfil />);
    expect(screen.queryByTestId('perfil-pendente')).toBeNull();
  });
});
