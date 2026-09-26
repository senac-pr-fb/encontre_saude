import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from '../LoginForm';

function propsPadrao(overrides: Partial<React.ComponentProps<typeof LoginForm>> = {}) {
  return {
    onSubmit: jest.fn(),
    onGoogle: jest.fn(),
    onEsqueceuSenha: jest.fn(),
    onCadastro: jest.fn(),
    carregando: false,
    carregandoGoogle: false,
    ...overrides,
  };
}

describe('LoginForm', () => {
  it('mostra erros de validação ao tentar enviar o formulário vazio', async () => {
    await render(<LoginForm {...propsPadrao()} />);

    await fireEvent.press(screen.getByText('Entrar'));

    expect(await screen.findByText('Informe um e-mail válido')).toBeTruthy();
    expect(await screen.findByText('Informe a senha')).toBeTruthy();
  });

  it('chama onSubmit com os dados quando o formulário é válido', async () => {
    const props = propsPadrao();
    await render(<LoginForm {...props} />);

    await fireEvent.changeText(screen.getByPlaceholderText('voce@exemplo.com'), 'usuario@exemplo.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Sua senha'), '123456');
    await fireEvent.press(screen.getByText('Entrar'));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        { email: 'usuario@exemplo.com', senha: '123456' },
        expect.anything(),
      ),
    );
  });

  it('exibe a mensagem de erro vinda do servidor', async () => {
    await render(<LoginForm {...propsPadrao({ erro: 'E-mail ou senha incorretos' })} />);
    expect(screen.getByText('E-mail ou senha incorretos')).toBeTruthy();
  });

  it('chama onGoogle, onEsqueceuSenha e onCadastro', async () => {
    const props = propsPadrao();
    await render(<LoginForm {...props} />);

    await fireEvent.press(screen.getByText('Entrar com Google'));
    await fireEvent.press(screen.getByText('Esqueceu a senha?'));
    await fireEvent.press(screen.getByText('Não tem conta? Cadastre-se'));

    expect(props.onGoogle).toHaveBeenCalledTimes(1);
    expect(props.onEsqueceuSenha).toHaveBeenCalledTimes(1);
    expect(props.onCadastro).toHaveBeenCalledTimes(1);
  });
});
