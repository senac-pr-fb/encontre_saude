import { montarContexto } from '../montarContexto';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import { VALIDADE_TRIAGEM_DOCUMENTO_MS } from '@domain/entities/ContextoSaude';
import type { InteracaoHistorico, Triagem } from '@domain/entities/Triagem';

const AGORA = Date.parse('2026-09-30T12:00:00Z');
const H = 60 * 60 * 1000;

const perfilCompleto: PerfilSaude = {
  ...perfilVazio('user-1'),
  sexo: 'Feminino',
  cpf: '12345678901',
  dataNascimento: '1990-05-10',
  telefone: '46999998888',
};

const triagem: Triagem = {
  nivel: 3,
  resumo: 'r',
  recomendacao: 'rec',
  primeirosSocorros: '',
  unidadeRecomendada: 'UBS',
  sintomas: ['febre'],
};

const interacao = (quando: number, over: Partial<InteracaoHistorico> = {}): InteracaoHistorico => ({
  id: String(quando),
  quando: new Date(quando).toISOString(),
  descricao: 'Febre alta desde ontem à noite',
  triagem,
  sintomas: [],
  episodioId: null,
  rotulo: null,
  recorrencia: [],
  ...over,
});

const montar = (over: Partial<Parameters<typeof montarContexto>[0]> = {}) =>
  montarContexto({
    perfil: perfilCompleto,
    fichaExiste: true,
    nome: 'Maria Souza',
    historico: [interacao(AGORA - 60_000)],
    agora: AGORA,
    ...over,
  });

describe('montarContexto', () => {
  it('fica pronto com ficha completa e triagem dentro da validade', () => {
    const c = montar();
    expect(c.situacao).toBe('pronto');
    expect(c.faltantes).toEqual([]);
    expect(c.triagemValida).toBe(true);
    expect(c.ultimaTriagem?.triagem.nivel).toBe(3);
  });

  it('sem nenhuma triagem no histórico, pede a pré-triagem', () => {
    expect(montar({ historico: [] }).situacao).toBe('sem-triagem');
  });

  it('ignora entradas do pré-prontuário manual, que não têm triagem', () => {
    const c = montar({ historico: [interacao(AGORA - 1000, { triagem: null }), interacao(AGORA - 5000)] });
    expect(c.ultimaTriagem?.id).toBe(String(AGORA - 5000));
  });

  it('triagem com mais de 24 h está vencida', () => {
    const c = montar({ historico: [interacao(AGORA - VALIDADE_TRIAGEM_DOCUMENTO_MS - 1)] });
    expect(c.triagemValida).toBe(false);
    expect(c.situacao).toBe('triagem-vencida');
  });

  it('lista os obrigatórios que faltam, inclusive o sexo não informado', () => {
    const c = montar({ perfil: perfilVazio('user-1'), nome: null, fichaExiste: false });
    expect(c.situacao).toBe('dados-faltando');
    expect(c.faltantes).toEqual(['nome', 'dataNascimento', 'cpf', 'sexo', 'telefone']);
  });

  it('usa as mesmas regras do formulário: CPF incompleto conta como faltante', () => {
    const c = montar({ perfil: { ...perfilCompleto, cpf: '123' } });
    expect(c.faltantes).toEqual(['cpf']);
  });

  it('sem triagem, a situação é sem-triagem mesmo com dados faltando', () => {
    const c = montar({ historico: [], perfil: perfilVazio('user-1') });
    expect(c.situacao).toBe('sem-triagem');
    expect(c.faltantes.length).toBeGreaterThan(0);
  });

  it('completude: obrigatórios contam junto com o histórico clínico', () => {
    expect(montar({ perfil: perfilVazio('user-1'), nome: null }).completude).toBe(0);
    // 5 obrigatórios de 11 campos
    expect(montar().completude).toBe(45);
    const cheio = {
      ...perfilCompleto,
      peso: 60,
      altura: 1.6,
      alergias: 'Nenhuma',
      medicamentosEmUso: 'Nenhum',
      doencasPreexistentes: 'Nenhuma',
      historicoFamiliar: 'Diabetes',
    };
    expect(montar({ perfil: cheio }).completude).toBe(100);
  });
});

describe('montarContexto — episódios', () => {
  // Dor de cabeça há 30 h, febre agora (continuação) e joelho há 2 h (outro problema).
  const cabeca = interacao(AGORA - 30 * H, { id: 'c1', descricao: 'Dor de cabeça forte', rotulo: 'dor de cabeça' });
  const febre = interacao(AGORA - 10 * 60_000, { id: 'c2', descricao: 'Agora febre de 38,5', episodioId: 'c1' });
  const joelho = interacao(AGORA - 2 * H, {
    id: 'j1',
    descricao: 'Dor no joelho depois da corrida',
    rotulo: 'dor no joelho',
    triagem: { ...triagem, nivel: 1, sintomas: [] },
  });
  const historico = [febre, joelho, cabeca];

  it('agrupa a continuação no mesmo episódio, em ordem cronológica', () => {
    const c = montar({ historico });
    expect(c.episodios.map((e) => e.id)).toEqual(['c1', 'j1']);
    expect(c.episodioAtual?.entradas.map((e) => e.id)).toEqual(['c1', 'c2']);
    expect(c.episodioAtual?.rotulo).toBe('dor de cabeça');
  });

  it('a validade conta do último relato do episódio', () => {
    // O primeiro relato tem 30 h, mas a febre de 10 min renova o episódio.
    const c = montar({ historico });
    expect(c.triagemValida).toBe(true);
    expect(c.ultimaTriagem?.id).toBe('c2');
  });

  it('dois problemas nas últimas 24 h ficam como episódios ativos separados', () => {
    const c = montar({ historico });
    expect(c.episodiosAtivos.map((e) => e.id)).toEqual(['c1', 'j1']);
  });

  it('sem a migration (sem episodioId), cada relato é um episódio', () => {
    const c = montar({ historico: [{ ...febre, episodioId: null }, cabeca] });
    expect(c.episodios).toHaveLength(2);
  });
});
