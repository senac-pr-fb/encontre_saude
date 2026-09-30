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
  (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'u', email: 'maria@x.com', nome: 'maria souza' } });
  (useContextoSaude as jest.Mock).mockReturnValue({ contexto: { faltantes: [] } });
});

describe('BotaoPerfil', () => {
  it('mostra a inicial do nome e abre o perfil', async () => {
    await render(<BotaoPerfil />);
    expect(screen.getByText('M')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/perfil');
  });

  it('usa o e-mail quando a conta não tem nome', async () => {
    (useAuth as jest.Mock).mockReturnValue({ usuario: { id: 'u', email: 'joao@x.com', nome: null } });
    await render(<BotaoPerfil />);
    expect(screen.getByText('J')).toBeTruthy();
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
