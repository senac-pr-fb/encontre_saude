import { render, screen, fireEvent } from '@testing-library/react-native';
import { Title, Subtitle, Body, ErrorMessage, SuccessMessage, TextLink } from '../Text';

describe('Title / Subtitle / Body', () => {
  it('renderizam o texto informado', async () => {
    await render(<Title>Título</Title>);
    expect(screen.getByText('Título')).toBeTruthy();

    await render(<Subtitle>Subtítulo</Subtitle>);
    expect(screen.getByText('Subtítulo')).toBeTruthy();

    await render(<Body>Corpo</Body>);
    expect(screen.getByText('Corpo')).toBeTruthy();
  });
});

describe('ErrorMessage', () => {
  it('renderiza a mensagem quando informada', async () => {
    await render(<ErrorMessage message="Algo deu errado" />);
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
  });

  it('não renderiza nada quando a mensagem é null/undefined/vazia', async () => {
    const { toJSON: semMensagem } = await render(<ErrorMessage message={null} />);
    expect(semMensagem()).toBeNull();

    const { toJSON: semProp } = await render(<ErrorMessage />);
    expect(semProp()).toBeNull();

    const { toJSON: vazia } = await render(<ErrorMessage message="" />);
    expect(vazia()).toBeNull();
  });
});

describe('SuccessMessage', () => {
  it('renderiza a mensagem quando informada', async () => {
    await render(<SuccessMessage message="Salvo com sucesso" />);
    expect(screen.getByText('Salvo com sucesso')).toBeTruthy();
  });

  it('não renderiza nada quando não há mensagem', async () => {
    const { toJSON } = await render(<SuccessMessage message={null} />);
    expect(toJSON()).toBeNull();
  });
});

describe('TextLink', () => {
  it('renderiza o texto e chama onPress ao ser pressionado', async () => {
    const onPress = jest.fn();
    await render(<TextLink onPress={onPress}>Esqueceu a senha?</TextLink>);

    await fireEvent.press(screen.getByText('Esqueceu a senha?'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
