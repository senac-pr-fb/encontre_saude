import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Emergencias } from '../Emergencias';

describe('Emergencias', () => {
  it('renderiza nome e número de cada contato de emergência', async () => {
    await render(<Emergencias />);

    expect(screen.getByText('SAMU')).toBeTruthy();
    expect(screen.getByText('192')).toBeTruthy();
    expect(screen.getByText('Bombeiros')).toBeTruthy();
    expect(screen.getByText('193')).toBeTruthy();
    // Usa o rótulo formatado quando presente, em vez do número cru.
    expect(screen.getByText('0800 722 6001')).toBeTruthy();
    expect(screen.queryByText('08007226001')).toBeNull();
  });

  it('liga para o número ao pressionar o contato', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await render(<Emergencias />);
    await fireEvent.press(screen.getByText('SAMU'));

    expect(openURL).toHaveBeenCalledWith('tel:192');
    openURL.mockRestore();
  });
});
