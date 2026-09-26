import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NovaSenhaForm } from '../NovaSenhaForm';

function propsPadrao(overrides: Partial<React.ComponentProps<typeof NovaSenhaForm>> = {}) {
  return { onSubmit: jest.fn(), carregando: false, ...overrides };
}

describe('NovaSenhaForm', () => {
  it('mostra erro quando a senha é muito curta', async () => {
    await render(<NovaSenhaForm {...propsPadrao()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123');
    await fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), '123');
    await fireEvent.press(screen.getByText('Salvar nova senha'));

    expect(await screen.findByText('A senha precisa ter pelo menos 6 caracteres')).toBeTruthy();
  });

  it('mostra erro quando as senhas não coincidem', async () => {
    await render(<NovaSenhaForm {...propsPadrao()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), '654321');
    await fireEvent.press(screen.getByText('Salvar nova senha'));

    expect(await screen.findByText('As senhas não coincidem')).toBeTruthy();
  });

  it('chama onSubmit quando o formulário é válido', async () => {
    const props = propsPadrao();
    await render(<NovaSenhaForm {...props} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    await fireEvent.changeText(screen.getByPlaceholderText('Repita a senha'), '123456');
    await fireEvent.press(screen.getByText('Salvar nova senha'));

    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({ senha: '123456', confirmarSenha: '123456' }, expect.anything()),
    );
  });

  it('exibe a mensagem de erro do servidor', async () => {
    await render(<NovaSenhaForm {...propsPadrao({ erro: 'Sessão expirada. Faça login novamente' })} />);
    expect(screen.getByText('Sessão expirada. Faça login novamente')).toBeTruthy();
  });
});
