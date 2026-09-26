import { render, screen, fireEvent } from '@testing-library/react-native';
import { SeletorSintomas } from '../SeletorSintomas';

describe('SeletorSintomas', () => {
  it('renderiza os 12 sintomas com o estado marcado correto', async () => {
    await render(<SeletorSintomas selecionados={['febre']} onChange={jest.fn()} />);

    expect(screen.getByText('Febre')).toBeTruthy();
    expect(screen.getByText('Tosse')).toBeTruthy();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(12);
    const marcados = checkboxes.filter((c) => c.props.accessibilityState?.checked);
    expect(marcados).toHaveLength(1);
  });

  it('adiciona o sintoma ao selecionar um ainda não marcado', async () => {
    const onChange = jest.fn();
    await render(<SeletorSintomas selecionados={['febre']} onChange={onChange} />);

    await fireEvent.press(screen.getByText('Tosse'));

    expect(onChange).toHaveBeenCalledWith(['febre', 'tosse']);
  });

  it('remove o sintoma ao selecionar um já marcado', async () => {
    const onChange = jest.fn();
    await render(<SeletorSintomas selecionados={['febre', 'tosse']} onChange={onChange} />);

    await fireEvent.press(screen.getByText('Febre'));

    expect(onChange).toHaveBeenCalledWith(['tosse']);
  });
});
