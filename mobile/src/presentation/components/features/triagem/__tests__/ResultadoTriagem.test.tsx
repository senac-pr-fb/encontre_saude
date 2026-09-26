import { render, screen } from '@testing-library/react-native';
import { ResultadoTriagem } from '../ResultadoTriagem';
import type { Triagem } from '@domain/entities/Triagem';

const triagemBase: Triagem = {
  nivel: 3,
  resumo: 'Sintomas significativos',
  recomendacao: 'Procure atendimento médico',
  primeirosSocorros: 'Mantenha a calma',
  unidadeRecomendada: 'UPA mais próxima',
  sintomas: ['febre', 'tosse'],
};

describe('ResultadoTriagem', () => {
  it('mostra o nível, o resumo e a recomendação', async () => {
    await render(<ResultadoTriagem triagem={triagemBase} />);

    expect(screen.getByText('Nível 3 · Urgente')).toBeTruthy();
    expect(screen.getByText('Sintomas significativos')).toBeTruthy();
    expect(screen.getByText('Procure atendimento médico')).toBeTruthy();
  });

  it('mostra primeiros socorros, unidade recomendada e sintomas quando presentes', async () => {
    await render(<ResultadoTriagem triagem={triagemBase} />);

    expect(screen.getByText('Mantenha a calma')).toBeTruthy();
    expect(screen.getByText('UPA mais próxima')).toBeTruthy();
    expect(screen.getByText('Febre')).toBeTruthy();
    expect(screen.getByText('Tosse')).toBeTruthy();
  });

  it('omite as seções de primeiros socorros, unidade e sintomas quando vazias', async () => {
    const triagem: Triagem = { ...triagemBase, primeirosSocorros: '', unidadeRecomendada: '', sintomas: [] };
    await render(<ResultadoTriagem triagem={triagem} />);

    expect(screen.queryByText('Primeiros socorros')).toBeNull();
    expect(screen.queryByText('Onde procurar atendimento')).toBeNull();
    expect(screen.queryByText('Sintomas identificados')).toBeNull();
  });

  it('mostra o nível de emergência corretamente', async () => {
    const triagem: Triagem = { ...triagemBase, nivel: 5 };
    await render(<ResultadoTriagem triagem={triagem} />);

    expect(screen.getByText('Nível 5 · Emergência')).toBeTruthy();
  });
});
