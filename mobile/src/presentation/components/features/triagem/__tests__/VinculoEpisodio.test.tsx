import { render, screen, fireEvent } from '@testing-library/react-native';
import { VinculoEpisodio } from '../VinculoEpisodio';

const episodio = { id: '4', desde: '2026-09-30T08:00:00Z', rotulo: 'dor de cabeça' };

describe('VinculoEpisodio', () => {
  it('diz a que relato a IA ligou este e permite desfazer', async () => {
    const onDesfazer = jest.fn();
    await render(<VinculoEpisodio episodio={episodio} onDesfazer={onDesfazer} desfazendo={false} desfeito={false} />);

    expect(screen.getByText(/continuação de dor de cabeça/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Não é isso'));
    expect(onDesfazer).toHaveBeenCalledTimes(1);
  });

  it('depois de desfeito, confirma que virou uma queixa separada', async () => {
    await render(<VinculoEpisodio episodio={episodio} onDesfazer={jest.fn()} desfazendo={false} desfeito />);

    expect(screen.getByText('Registrado como uma queixa separada.')).toBeTruthy();
    expect(screen.queryByText('Não é isso')).toBeNull();
  });
});
