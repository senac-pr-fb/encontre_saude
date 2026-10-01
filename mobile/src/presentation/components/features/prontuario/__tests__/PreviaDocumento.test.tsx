import { render, screen } from '@testing-library/react-native';
import { PreviaDocumento } from '../PreviaDocumento';
import { montarContexto } from '@domain/usecases/contexto';
import { perfilVazio } from '@domain/entities/PerfilSaude';
import type { InteracaoHistorico } from '@domain/entities/Triagem';

const historico: InteracaoHistorico[] = [
  {
    id: 'h1',
    quando: new Date().toISOString(),
    descricao: 'Febre alta desde ontem à noite',
    sintomas: [],
    triagem: { nivel: 3, resumo: 'r', recomendacao: 'rec', primeirosSocorros: '', unidadeRecomendada: 'UBS', sintomas: ['febre', 'tosse'] },
  },
];

const contexto = (alergias: string | null) =>
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
    await render(<PreviaDocumento contexto={contexto('Dipirona')} />);

    expect(screen.getByText('Nível 3 · Urgente')).toBeTruthy();
    expect(screen.getByText('Febre alta desde ontem à noite')).toBeTruthy();
    expect(screen.getByText('Febre · Tosse')).toBeTruthy();
    expect(screen.getByText('123.456.789-01')).toBeTruthy();
    expect(screen.getByText('10/05/1990')).toBeTruthy();
    expect(screen.getByText('Dipirona')).toBeTruthy();
  });

  it('avisa quando a ficha não tem histórico clínico', async () => {
    await render(<PreviaDocumento contexto={contexto(null)} />);
    expect(screen.getByText('Nada informado na sua ficha.')).toBeTruthy();
  });
});
