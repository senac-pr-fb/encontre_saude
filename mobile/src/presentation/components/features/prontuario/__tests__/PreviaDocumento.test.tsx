import { render, screen } from '@testing-library/react-native';
import { PreviaDocumento } from '../PreviaDocumento';
import { montarContexto } from '@domain/usecases/contexto';
import { perfilVazio } from '@domain/entities/PerfilSaude';
import type { InteracaoHistorico, Triagem } from '@domain/entities/Triagem';

const triagem: Triagem = {
  nivel: 3,
  resumo: 'r',
  recomendacao: 'rec',
  primeirosSocorros: '',
  unidadeRecomendada: 'UBS',
  sintomas: ['febre', 'tosse'],
};

const relato = (over: Partial<InteracaoHistorico> = {}): InteracaoHistorico => ({
  id: 'h1',
  quando: new Date().toISOString(),
  descricao: 'Febre alta desde ontem à noite',
  sintomas: [],
  triagem,
  episodioId: null,
  rotulo: 'febre',
  recorrencia: [],
  ...over,
});

const contexto = (alergias: string | null, historico: InteracaoHistorico[] = [relato()]) =>
  montarContexto({
    perfil: {
      ...perfilVazio('user-1'),
      sexo: 'Feminino',
      cpf: '12345678901',
      dataNascimento: '1990-05-10',
      telefone: '46999998888',
      alergias,
    },
    fichaExiste: true,
    nome: 'Maria Souza',
    historico,
  });

describe('PreviaDocumento', () => {
  it('mostra a queixa com o nível e os dados formatados', async () => {
    const c = contexto('Dipirona');
    await render(<PreviaDocumento contexto={c} episodio={c.episodioAtual} />);

    expect(screen.getByText('Nível 3 · Urgente')).toBeTruthy();
    expect(screen.getByText('Febre alta desde ontem à noite')).toBeTruthy();
    expect(screen.getByText('Febre · Tosse')).toBeTruthy();
    expect(screen.getByText('123.456.789-01')).toBeTruthy();
    expect(screen.getByText('10/05/1990')).toBeTruthy();
    expect(screen.getByText('Dipirona')).toBeTruthy();
  });

  it('avisa quando a ficha não tem histórico clínico', async () => {
    const c = contexto(null);
    await render(<PreviaDocumento contexto={c} episodio={c.episodioAtual} />);
    expect(screen.getByText('Nada informado na sua ficha.')).toBeTruthy();
  });

  it('episódio com vários relatos mostra cada um', async () => {
    const antes = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const c = contexto(null, [
      relato({ id: 'h2', descricao: 'Agora com tosse', episodioId: 'h1' }),
      relato({ quando: antes, descricao: 'Dor de cabeça forte' }),
    ]);
    await render(<PreviaDocumento contexto={c} episodio={c.episodioAtual} />);

    expect(screen.getByText('Dor de cabeça forte')).toBeTruthy();
    expect(screen.getByText('Agora com tosse')).toBeTruthy();
    expect(screen.getByText(/^desde /)).toBeTruthy();
  });

  it('mostra recorrência e outras queixas quando houver', async () => {
    const c = contexto(null);
    await render(
      <PreviaDocumento
        contexto={c}
        episodio={c.episodioAtual}
        historicoRecente={{
          recorrencia: ['dor de cabeça: 3 episódios anteriores em 6 meses'],
          outrasQueixas: ['29/09 18:10 — dor no joelho (não urgente)'],
        }}
      />,
    );

    expect(screen.getByText('• dor de cabeça: 3 episódios anteriores em 6 meses')).toBeTruthy();
    expect(screen.getByText('• 29/09 18:10 — dor no joelho (não urgente)')).toBeTruthy();
  });
});
