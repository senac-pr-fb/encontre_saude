import { render, screen, fireEvent } from '@testing-library/react-native';
import { HistoricoTriagem } from '../HistoricoTriagem';
import type { InteracaoHistorico } from '@domain/entities/Triagem';

async function abrirAcordeao() {
  await fireEvent.press(screen.getByRole('button'));
}

describe('HistoricoTriagem', () => {
  it('mostra o título sem contagem quando não há interações', async () => {
    await render(<HistoricoTriagem interacoes={[]} carregando={false} />);
    expect(screen.getByText('Histórico de consultas')).toBeTruthy();
  });

  it('mostra a contagem no título quando há interações', async () => {
    const interacoes: InteracaoHistorico[] = [
      { id: '1', quando: '2024-01-01T10:00:00Z', descricao: 'Dor', triagem: null, sintomas: [] },
    ];
    await render(<HistoricoTriagem interacoes={interacoes} carregando={false} />);
    expect(screen.getByText('Histórico de consultas (1)')).toBeTruthy();
  });

  it('mostra "Carregando..." enquanto carrega', async () => {
    await render(<HistoricoTriagem interacoes={[]} carregando={true} />);
    await abrirAcordeao();
    expect(screen.getByText('Carregando...')).toBeTruthy();
  });

  it('mostra mensagem de vazio quando não há histórico', async () => {
    await render(<HistoricoTriagem interacoes={[]} carregando={false} />);
    await abrirAcordeao();
    expect(screen.getByText(/Nenhuma consulta salva ainda/)).toBeTruthy();
  });

  it('mostra o selo "Pré-prontuário" para registros sem triagem da IA', async () => {
    const interacoes: InteracaoHistorico[] = [
      { id: '1', quando: '2024-01-01T10:00:00Z', descricao: 'Consulta manual', triagem: null, sintomas: ['febre'] },
    ];
    await render(<HistoricoTriagem interacoes={interacoes} carregando={false} />);
    await abrirAcordeao();

    expect(screen.getByText('Pré-prontuário')).toBeTruthy();
    expect(screen.getByText('Consulta manual')).toBeTruthy();
    expect(screen.getByText('Febre')).toBeTruthy();
  });

  it('mostra o nível e a recomendação para registros com triagem da IA', async () => {
    const interacoes: InteracaoHistorico[] = [
      {
        id: '2',
        quando: '2024-01-01T10:00:00Z',
        descricao: 'Estou com febre',
        triagem: {
          nivel: 3,
          resumo: 'r',
          recomendacao: 'Procure atendimento médico',
          primeirosSocorros: '',
          unidadeRecomendada: '',
          sintomas: [],
        },
        sintomas: [],
      },
    ];
    await render(<HistoricoTriagem interacoes={interacoes} carregando={false} />);
    await abrirAcordeao();

    expect(screen.getByText('Urgente')).toBeTruthy();
    expect(screen.getByText('Procure atendimento médico')).toBeTruthy();
  });
});
