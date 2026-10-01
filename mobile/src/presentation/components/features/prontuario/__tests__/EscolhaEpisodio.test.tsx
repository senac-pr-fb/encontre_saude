import { render, screen, fireEvent } from '@testing-library/react-native';
import { EscolhaEpisodio } from '../EscolhaEpisodio';
import { agruparEpisodios } from '@domain/usecases/contexto';
import type { InteracaoHistorico } from '@domain/entities/Triagem';

const relato = (id: string, rotulo: string, nivel: 1 | 3): InteracaoHistorico => ({
  id,
  quando: '2026-09-30T10:00:00Z',
  descricao: `relato ${id}`,
  sintomas: [],
  triagem: { nivel, resumo: '', recomendacao: '', primeirosSocorros: '', unidadeRecomendada: '', sintomas: [] },
  episodioId: null,
  rotulo,
  recorrencia: [],
});

const episodios = agruparEpisodios([relato('c1', 'dor de cabeça', 3), relato('j1', 'dor no joelho', 1)]);

describe('EscolhaEpisodio', () => {
  it('lista os episódios ativos com o selecionado marcado', async () => {
    await render(<EscolhaEpisodio episodios={episodios} selecionado="c1" onEscolher={jest.fn()} />);

    expect(screen.getByText('dor de cabeça')).toBeTruthy();
    expect(screen.getByText(/Não Urgente/)).toBeTruthy();
    const opcoes = screen.getAllByRole('radio');
    expect(opcoes.map((o) => o.props.accessibilityState?.selected)).toEqual([true, false]);
  });

  it('avisa qual foi escolhido', async () => {
    const onEscolher = jest.fn();
    await render(<EscolhaEpisodio episodios={episodios} selecionado="c1" onEscolher={onEscolher} />);

    await fireEvent.press(screen.getByText('dor no joelho'));
    expect(onEscolher).toHaveBeenCalledWith('j1');
  });
});
