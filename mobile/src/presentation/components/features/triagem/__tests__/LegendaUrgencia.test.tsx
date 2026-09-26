import { render, screen, fireEvent } from '@testing-library/react-native';
import { LegendaUrgencia } from '../LegendaUrgencia';

describe('LegendaUrgencia', () => {
  it('mostra o título fechado por padrão, sem os níveis', async () => {
    await render(<LegendaUrgencia />);

    expect(screen.getByText('Níveis de urgência')).toBeTruthy();
    expect(screen.queryByText(/Não Urgente/)).toBeNull();
  });

  it('mostra os 5 níveis ao abrir o acordeão', async () => {
    await render(<LegendaUrgencia />);

    await fireEvent.press(screen.getByRole('button'));

    expect(screen.getByText('1. Não Urgente')).toBeTruthy();
    expect(screen.getByText('2. Pouco Urgente')).toBeTruthy();
    expect(screen.getByText('3. Urgente')).toBeTruthy();
    expect(screen.getByText('4. Muito Urgente')).toBeTruthy();
    expect(screen.getByText('5. Emergência')).toBeTruthy();
  });
});
