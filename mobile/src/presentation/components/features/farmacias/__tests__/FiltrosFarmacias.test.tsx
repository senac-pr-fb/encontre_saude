import { render, screen, fireEvent } from '@testing-library/react-native';
import { FiltrosFarmacias } from '../FiltrosFarmacias';
import { FILTRO_INICIAL } from '@domain/usecases/farmacias';

function propsPadrao(overrides: Partial<React.ComponentProps<typeof FiltrosFarmacias>> = {}) {
  return {
    filtro: FILTRO_INICIAL,
    bairros: ['Água Branca', 'Centro'],
    onTermo: jest.fn(),
    onBairro: jest.fn(),
    onTipo: jest.fn(),
    ...overrides,
  };
}

describe('FiltrosFarmacias', () => {
  it('renderiza o campo de busca, os tipos e os bairros', async () => {
    await render(<FiltrosFarmacias {...propsPadrao()} />);

    expect(screen.getByPlaceholderText('Nome ou bairro')).toBeTruthy();
    expect(screen.getByText('Municipal')).toBeTruthy();
    expect(screen.getByText('Privada')).toBeTruthy();
    expect(screen.getByText('Todos')).toBeTruthy();
    expect(screen.getByText('Água Branca')).toBeTruthy();
    expect(screen.getByText('Centro')).toBeTruthy();
  });

  it('chama onTermo ao digitar na busca', async () => {
    const props = propsPadrao();
    await render(<FiltrosFarmacias {...props} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Nome ou bairro'), 'central');

    expect(props.onTermo).toHaveBeenCalledWith('central');
  });

  it('marca os tipos ativos conforme o filtro e chama onTipo ao pressionar', async () => {
    const props = propsPadrao({ filtro: { ...FILTRO_INICIAL, tipos: ['Municipal'] } });
    await render(<FiltrosFarmacias {...props} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const municipal = checkboxes.find((c) => c.props.accessibilityState?.checked);
    expect(municipal).toBeTruthy();

    await fireEvent.press(screen.getByText('Privada'));
    expect(props.onTipo).toHaveBeenCalledWith('Privada');
  });

  it('chama onBairro ao pressionar um chip de bairro ou "Todos"', async () => {
    const props = propsPadrao({ filtro: { ...FILTRO_INICIAL, bairro: 'Centro' } });
    await render(<FiltrosFarmacias {...props} />);

    await fireEvent.press(screen.getByText('Água Branca'));
    expect(props.onBairro).toHaveBeenCalledWith('Água Branca');

    await fireEvent.press(screen.getByText('Todos'));
    expect(props.onBairro).toHaveBeenCalledWith(null);
  });
});
