import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AvisoMedico, ChamarSamu } from '../AvisoMedico';

describe('AvisoMedico', () => {
  it('exibe o aviso de que não substitui consulta médica', async () => {
    await render(<AvisoMedico />);
    expect(screen.getByText('não substitui uma consulta médica')).toBeTruthy();
  });

  it('liga para o 192 ao pressionar o número no texto', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await render(<AvisoMedico />);
    await fireEvent.press(screen.getByText('192'));

    expect(openURL).toHaveBeenCalledWith('tel:192');
    openURL.mockRestore();
  });
});

describe('ChamarSamu', () => {
  it('renderiza o botão e liga para o SAMU ao pressionar', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await render(<ChamarSamu />);
    await fireEvent.press(screen.getByText('Ligar para o SAMU (192)'));

    expect(openURL).toHaveBeenCalledWith('tel:192');
    openURL.mockRestore();
  });
});
