import { render, screen, fireEvent } from '@testing-library/react-native';
import { SugestaoFicha } from '../SugestaoFicha';

describe('SugestaoFicha', () => {
  it('mostra o que mudaria na ficha e só salva se confirmado', async () => {
    const onSalvar = jest.fn();
    const onDispensar = jest.fn();
    await render(
      <SugestaoFicha
        sugestoes={{ medicamentosEmUso: 'Losartana 50 mg' }}
        onSalvar={onSalvar}
        onDispensar={onDispensar}
        salvando={false}
      />,
    );

    expect(screen.getByText('Medicamentos em uso')).toBeTruthy();
    expect(screen.getByText('Losartana 50 mg')).toBeTruthy();

    await fireEvent.press(screen.getByText('Agora não'));
    expect(onDispensar).toHaveBeenCalledTimes(1);
    expect(onSalvar).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Salvar na ficha'));
    expect(onSalvar).toHaveBeenCalledTimes(1);
  });
});
