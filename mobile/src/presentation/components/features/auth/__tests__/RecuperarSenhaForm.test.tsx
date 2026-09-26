import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { RecuperarSenhaForm } from '../RecuperarSenhaForm';

function propsPadrao(overrides: Partial<React.ComponentProps<typeof RecuperarSenhaForm>> = {}) {
  return { onSubmit: jest.fn(), onVoltar: jest.fn(), carregando: false, enviado: false, ...overrides };
}

describe('RecuperarSenhaForm', () => {
  it('mostra erro de validação para e-mail inválido', async () => {
    await render(<RecuperarSenhaForm {...propsPadrao()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('voce@exemplo.com'), 'invalido');
    await fireEvent.press(screen.getByText('Enviar link'));

    expect(await screen.findByText('Informe um e-mail válido')).toBeTruthy();
  });

  it('chama onSubmit com o e-mail quando válido', async () => {
    const props = propsPadrao();
    await render(<RecuperarSenhaForm {...props} />);

    await fireEvent.changeText(screen.getByPlaceholderText('voce@exemplo.com'), 'a@b.com');
    await fireEvent.press(screen.getByText('Enviar link'));

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' }, expect.anything()));
  });

  it('exibe a mensagem de sucesso e esconde o formulário quando enviado=true', async () => {
    await render(<RecuperarSenhaForm {...propsPadrao({ enviado: true })} />);

    expect(screen.getByText(/Enviamos um link/)).toBeTruthy();
    expect(screen.queryByPlaceholderText('voce@exemplo.com')).toBeNull();
  });

  it('chama onVoltar ao pressionar o link', async () => {
    const props = propsPadrao({ enviado: true });
    await render(<RecuperarSenhaForm {...props} />);

    await fireEvent.press(screen.getByText('Voltar para o login'));

    expect(props.onVoltar).toHaveBeenCalledTimes(1);
  });
});
