import { render, screen } from '@testing-library/react-native';
import { Etapas } from '../Etapas';

describe('Etapas', () => {
  it('renderiza os títulos das 4 etapas', async () => {
    await render(<Etapas atual={1} />);

    expect(screen.getByText('Dados pessoais')).toBeTruthy();
    expect(screen.getByText('Sintomas')).toBeTruthy();
    expect(screen.getByText('Histórico clínico')).toBeTruthy();
    expect(screen.getByText('Revisão')).toBeTruthy();
  });

  it('mostra o ícone de check nas etapas já concluídas', async () => {
    await render(<Etapas atual={3} />);

    // Etapas 1 e 2 já passaram (numero < atual): ícone "check" em ambas.
    expect(screen.getAllByText('check')).toHaveLength(2);
    // Etapa 3 é a atual: mostra o ícone próprio dela.
    expect(screen.getByText('notes-medical')).toBeTruthy();
    // Etapa 4 ainda não chegou: mostra o ícone próprio dela.
    expect(screen.getByText('file-circle-check')).toBeTruthy();
  });

  it('não marca nenhuma etapa como concluída quando está na primeira', async () => {
    await render(<Etapas atual={1} />);
    expect(screen.queryByText('check')).toBeNull();
  });
});
