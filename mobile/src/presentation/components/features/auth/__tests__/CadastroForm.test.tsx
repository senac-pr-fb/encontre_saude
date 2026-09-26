import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CadastroForm } from '../CadastroForm';

function propsPadrao(overrides: Partial<React.ComponentProps<typeof CadastroForm>> = {}) {
  return { onSubmit: jest.fn(), onLogin: jest.fn(), carregando: false, ...overrides };
}

describe('CadastroForm', () => {
  it('mostra erro de validação quando o formulário está vazio', async () => {
    await render(<CadastroForm {...propsPadrao()} />);

    await fireEvent.press(screen.getByText('Criar conta'));

    expect(await screen.findByText('Informe um e-mail válido')).toBeTruthy();
  });

  it('mostra erro quando as senhas não coincidem', async () => {
    await render(<CadastroForm {...propsPadrao()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('voce@exemplo.com'), 'a@b.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), 'outra123');
    await fireEvent.press(screen.getByText('Criar conta'));

    expect(await screen.findByText('As senhas não coincidem')).toBeTruthy();
  });

  it('chama onSubmit quando o formulário é válido', async () => {
    const props = propsPadrao();
    await render(<CadastroForm {...props} />);

    await fireEvent.changeText(screen.getByPlaceholderText('voce@exemplo.com'), 'a@b.com');
    await fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), '123456');
    await fireEvent.press(screen.getByText('Criar conta'));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        { email: 'a@b.com', senha: '123456', confirmarSenha: '123456' },
        expect.anything(),
      ),
    );
  });

  it('exibe erro do servidor e chama onLogin', async () => {
    const props = propsPadrao({ erro: 'Este e-mail já está cadastrado' });
    await render(<CadastroForm {...props} />);

    expect(screen.getByText('Este e-mail já está cadastrado')).toBeTruthy();

    await fireEvent.press(screen.getByText('Já tem conta? Entrar'));
    expect(props.onLogin).toHaveBeenCalledTimes(1);
  });
});
