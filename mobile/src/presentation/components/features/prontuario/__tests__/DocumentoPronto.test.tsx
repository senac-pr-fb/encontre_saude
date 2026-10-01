import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { DocumentoPronto } from '../DocumentoPronto';

jest.mock('@core/config/ambiente', () => ({ ehExpoGo: false }));

describe('DocumentoPronto', () => {
  it('imprime, compartilha e volta', async () => {
    const onImprimir = jest.fn().mockResolvedValue(undefined);
    const onCompartilhar = jest.fn().mockResolvedValue(undefined);
    const onVoltar = jest.fn();
    await render(<DocumentoPronto onImprimir={onImprimir} onCompartilhar={onCompartilhar} onVoltar={onVoltar} />);

    await fireEvent.press(screen.getByText('Salvar ou imprimir PDF'));
    await fireEvent.press(screen.getByText('Compartilhar arquivo'));
    await fireEvent.press(screen.getByText('Voltar ao início'));

    expect(onImprimir).toHaveBeenCalledTimes(1);
    expect(onCompartilhar).toHaveBeenCalledTimes(1);
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });

  it('quando abrir o arquivo falha, mostra mensagem própria, não a do SDK', async () => {
    const onCompartilhar = jest.fn().mockRejectedValue(new Error('ERR_FILE_SYSTEM: /data/user/0/... not readable'));
    await render(<DocumentoPronto onImprimir={jest.fn()} onCompartilhar={onCompartilhar} onVoltar={jest.fn()} />);

    await fireEvent.press(screen.getByText('Compartilhar arquivo'));

    await waitFor(() => expect(screen.getByText(/Não foi possível abrir o arquivo/)).toBeTruthy());
    expect(screen.queryByText(/ERR_FILE_SYSTEM/)).toBeNull();
  });
});
