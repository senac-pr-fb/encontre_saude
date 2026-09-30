import { montarContexto } from '../montarContexto';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import { VALIDADE_TRIAGEM_DOCUMENTO_MS } from '@domain/entities/ContextoSaude';
import type { InteracaoHistorico, Triagem } from '@domain/entities/Triagem';

const AGORA = Date.parse('2026-09-30T12:00:00Z');

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

const interacao = (quando: number, comTriagem = true): InteracaoHistorico => ({
  id: String(quando),
  quando: new Date(quando).toISOString(),
  descricao: 'Febre alta desde ontem à noite',
  triagem: comTriagem ? triagem : null,
  sintomas: [],
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
    const c = montar({ historico: [interacao(AGORA - 1000, false), interacao(AGORA - 5000)] });
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
});
