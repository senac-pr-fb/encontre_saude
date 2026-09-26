import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renderiza o título', async () => {
    await render(<Button title="Entrar" />);
    expect(screen.getByText('Entrar')).toBeTruthy();
  });

  it('chama onPress ao ser pressionado', async () => {
    const onPress = jest.fn();
    await render(<Button title="Entrar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não chama onPress quando desabilitado', async () => {
    const onPress = jest.fn();
    await render(<Button title="Entrar" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('não chama onPress e esconde o título enquanto carrega', async () => {
    const onPress = jest.fn();
    await render(<Button title="Entrar" onPress={onPress} loading />);

    expect(screen.queryByText('Entrar')).toBeNull();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
