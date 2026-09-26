import { render, screen, fireEvent } from '@testing-library/react-native';
import { Toggle, Opcoes } from '../Choice';

describe('Toggle', () => {
  it('renderiza o rótulo e reflete o valor', async () => {
    await render(<Toggle label="Fuma?" value={false} onValueChange={jest.fn()} />);
    expect(screen.getByText('Fuma?')).toBeTruthy();
  });

  it('chama onValueChange ao alternar', async () => {
    const onValueChange = jest.fn();
    await render(<Toggle label="Fuma?" value={false} onValueChange={onValueChange} />);

    await fireEvent(screen.getByRole('switch'), 'valueChange', true);

    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});

describe('Opcoes', () => {
  const opcoes = ['Masculino', 'Feminino', 'Outro'] as const;

  it('renderiza todas as opções', async () => {
    await render(<Opcoes label="Sexo" opcoes={opcoes} value={null} onChange={jest.fn()} />);

    opcoes.forEach((op) => expect(screen.getByText(op)).toBeTruthy());
  });

  it('marca a opção selecionada como ativa (accessibilityState)', async () => {
    await render(<Opcoes label="Sexo" opcoes={opcoes} value="Feminino" onChange={jest.fn()} />);

    const radios = screen.getAllByRole('radio');
    const selecionado = radios.find((r) => r.props.accessibilityState?.selected);
    expect(selecionado).toBeTruthy();
  });

  it('chama onChange com a opção clicada', async () => {
    const onChange = jest.fn();
    await render(<Opcoes label="Sexo" opcoes={opcoes} value={null} onChange={onChange} />);

    await fireEvent.press(screen.getByText('Outro'));

    expect(onChange).toHaveBeenCalledWith('Outro');
  });

  it('exibe a mensagem de erro quando informada', async () => {
    await render(<Opcoes label="Sexo" opcoes={opcoes} value={null} onChange={jest.fn()} error="Selecione uma opção" />);

    expect(screen.getByText('Selecione uma opção')).toBeTruthy();
  });
});
