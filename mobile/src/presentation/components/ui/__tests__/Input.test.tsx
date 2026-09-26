import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input, PasswordInput } from '../Input';

describe('Input', () => {
  it('renderiza o rótulo e aceita texto digitado', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="E-mail" value="" onChangeText={onChangeText} />);

    expect(screen.getByText('E-mail')).toBeTruthy();
    await fireEvent.changeText(screen.getByDisplayValue(''), 'a@b.com');
    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('exibe a mensagem de erro quando informada', async () => {
    await render(<Input label="E-mail" error="Informe um e-mail válido" />);
    expect(screen.getByText('Informe um e-mail válido')).toBeTruthy();
  });

  it('não exibe mensagem de erro quando não informada', async () => {
    await render(<Input label="E-mail" />);
    expect(screen.queryByText(/válido/)).toBeNull();
  });
});

describe('PasswordInput', () => {
  it('inicia com o texto oculto e alterna a visibilidade ao pressionar o botão', async () => {
    await render(<PasswordInput label="Senha" value="123456" />);

    const campo = screen.getByDisplayValue('123456');
    expect(campo.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByLabelText('Mostrar senha'));

    expect(screen.getByDisplayValue('123456').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Ocultar senha')).toBeTruthy();
  });

  it('exibe a mensagem de erro quando informada', async () => {
    await render(<PasswordInput label="Senha" error="Senha muito curta" />);
    expect(screen.getByText('Senha muito curta')).toBeTruthy();
  });
});
