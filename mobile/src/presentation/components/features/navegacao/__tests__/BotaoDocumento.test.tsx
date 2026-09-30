import { render, screen, fireEvent } from '@testing-library/react-native';
import { BotaoDocumento } from '../BotaoDocumento';

describe('BotaoDocumento', () => {
  it('mostra o rótulo e chama onPress', async () => {
    const onPress = jest.fn();
    await render(<BotaoDocumento onPress={onPress} />);
    expect(screen.getByText('Pré-prontuário')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Gerar pré-prontuário'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
