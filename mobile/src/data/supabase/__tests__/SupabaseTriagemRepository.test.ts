import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseTriagemRepository } from '../SupabaseTriagemRepository';
import { DomainError } from '@domain/errors';

interface QueryFake {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
}

function criarSupabaseFake(respostaHistorico: { data: unknown; error: unknown } = { data: [], error: null }) {
  const query: QueryFake = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    order: jest.fn(() => query),
    limit: jest.fn().mockResolvedValue(respostaHistorico),
  };
  const from = jest.fn().mockReturnValue(query);
  const invoke = jest.fn();
  return {
    supabase: { from, functions: { invoke } } as unknown as SupabaseClient,
    query,
    from,
    invoke,
  };
}

describe('SupabaseTriagemRepository.analisar', () => {
  it('mapeia a resposta da versão anterior da função (sem os campos da conversa)', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({
      data: {
        nivel: 3,
        resumo: 'Sintomas significativos',
        recomendacao: 'Procure atendimento',
        primeiros_socorros: 'Descanse',
        unidade_recomendada: 'UPA',
        sintomas: { febre: true, tosse: false },
      },
      error: null,
    });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('febre e mal estar');

    expect(invoke).toHaveBeenCalledWith('triagem', { body: { descricao: 'febre e mal estar' } });
    expect(resultado).toEqual({
      ok: true,
      value: {
        triagem: {
          nivel: 3,
          resumo: 'Sintomas significativos',
          recomendacao: 'Procure atendimento',
          primeirosSocorros: 'Descanse',
          unidadeRecomendada: 'UPA',
          sintomas: ['febre'],
        },
        perguntas: [],
        atualizacoes: { alergias: null, medicamentosEmUso: null, doencasPreexistentes: null },
        historicoId: null,
        rotulo: null,
        episodioAnterior: null,
        recorrencia: [],
      },
    });
  });

  it('mapeia perguntas, sugestões para a ficha e o registro do histórico', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({
      data: {
        nivel: 2,
        resumo: 'r',
        recomendacao: 'rec',
        primeiros_socorros: '',
        unidade_recomendada: 'UBS',
        sintomas: {},
        perguntas: [
          { campo: 'alergias', pergunta: 'Você tem alergia a algum remédio?' },
          { campo: 'sintoma', pergunta: '  ' },
        ],
        atualizacoes_ficha: { alergias: null, medicamentos_em_uso: 'Losartana', doencas_preexistentes: null },
        historico_id: 42,
      },
      error: null,
    });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('pressão alta e dor de cabeça');

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.value.perguntas).toEqual([{ campo: 'alergias', pergunta: 'Você tem alergia a algum remédio?' }]);
      expect(resultado.value.atualizacoes.medicamentosEmUso).toBe('Losartana');
      expect(resultado.value.historicoId).toBe('42');
    }
  });

  it('na segunda rodada envia as respostas e o registro a atualizar', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({ data: { nivel: 1, sintomas: {} }, error: null });
    const respostas = [{ pergunta: 'Alergias?', resposta: 'Dipirona' }];

    await new SupabaseTriagemRepository(supabase).analisar('relato', { respostas, historicoId: '42' });

    expect(invoke).toHaveBeenCalledWith('triagem', {
      body: { descricao: 'relato', respostas, historico_id: '42' },
    });
  });

  it('usa o nível 1 quando a IA devolve um nível fora da escala', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({
      data: { nivel: 99, resumo: '', recomendacao: '', primeiros_socorros: '', unidade_recomendada: '', sintomas: {} },
      error: null,
    });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('texto');

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.triagem.nivel).toBe(1);
  });

  it('lê a mensagem de erro do corpo da resposta quando a função falha', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({
      data: null,
      error: { context: { json: jest.fn().mockResolvedValue({ erro: 'Gemini indisponível' }) } },
    });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('texto');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error).toBeInstanceOf(DomainError);
      expect(resultado.error.message).toBe('Gemini indisponível');
    }
  });

  it('usa mensagem padrão quando o erro não traz corpo legível', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({ data: null, error: { message: 'erro genérico' } });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('texto');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.message).toBe('Não foi possível analisar os sintomas agora');
  });

  it('retorna erro quando a resposta vem vazia', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({ data: null, error: null });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('texto');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.message).toBe('Resposta vazia da triagem');
  });

  it('retorna erro quando a resposta traz o campo erro preenchido', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({ data: { erro: 'limite de uso excedido' }, error: null });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('texto');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.message).toBe('limite de uso excedido');
  });
});

describe('SupabaseTriagemRepository.historico', () => {
  it('mapeia as linhas do histórico, incluindo a triagem interpretada do JSON salvo', async () => {
    const { supabase, from } = criarSupabaseFake({
      data: [
        {
          id: 1,
          created_at: '2024-01-01T00:00:00Z',
          descricao_usuario: 'Dor de cabeça',
          resposta_ia: JSON.stringify({
            nivel: 3,
            resumo: 'r',
            recomendacao: 'rec',
            primeiros_socorros: 'ps',
            unidade_recomendada: 'UPA',
            sintomas: { febre: true },
          }),
          sintomas_atendimento: { febre: true, tosse: false },
        },
        {
          id: 2,
          created_at: '2024-01-02T00:00:00Z',
          descricao_usuario: null,
          resposta_ia: 'Pré-Prontuário gerado manualmente pelo usuário.',
          sintomas_atendimento: [{ febre: false, tosse: true }],
        },
      ],
      error: null,
    });

    const resultado = await new SupabaseTriagemRepository(supabase).historico('user-1');

    expect(from).toHaveBeenCalledWith('historico_ia');
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.value).toHaveLength(2);
    expect(resultado.value[0]).toEqual(
      expect.objectContaining({ id: '1', descricao: 'Dor de cabeça', sintomas: ['febre'] }),
    );
    expect(resultado.value[0].triagem).toEqual(expect.objectContaining({ nivel: 3, sintomas: ['febre'] }));

    // resposta_ia sem JSON válido (registro do pré-prontuário) -> sem triagem estruturada.
    expect(resultado.value[1]).toEqual(expect.objectContaining({ id: '2', descricao: '', sintomas: ['tosse'] }));
    expect(resultado.value[1].triagem).toBeNull();
  });

  it('propaga o erro do Supabase', async () => {
    const { supabase } = criarSupabaseFake({ data: null, error: { message: 'falha ao buscar histórico' } });

    const resultado = await new SupabaseTriagemRepository(supabase).historico('user-1');

    expect(resultado.ok).toBe(false);
  });
});

describe('SupabaseTriagemRepository — episódios', () => {
  const linha = {
    id: 5,
    created_at: '2026-09-30T10:00:00Z',
    descricao_usuario: 'Agora febre',
    resposta_ia: JSON.stringify({
      nivel: 3,
      sintomas: {},
      recorrencia: [{ rotulo: 'dor de cabeça', episodios: 2, ultimos_30_dias: 1, ultimo_em: '2026-09-20T00:00:00Z', nivel_max: 2 }],
    }),
    sintomas_atendimento: { febre: true },
    episodio_id: 4,
    queixa_rotulo: 'dor de cabeça',
  };

  it('lê episódio, rótulo e a recorrência gravada no registro', async () => {
    const { supabase, query } = criarSupabaseFake({ data: [linha], error: null });

    const resultado = await new SupabaseTriagemRepository(supabase).historico('user-1');

    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('episodio_id, queixa_rotulo'));
    expect(resultado.ok && resultado.value[0]).toEqual(
      expect.objectContaining({
        episodioId: '4',
        rotulo: 'dor de cabeça',
        recorrencia: [{ rotulo: 'dor de cabeça', episodios: 2, ultimos30Dias: 1, ultimoEm: '2026-09-20T00:00:00Z', nivelMax: 2 }],
      }),
    );
  });

  it('sem a migration, cai para a consulta antiga e cada relato fica sem episódio', async () => {
    const { supabase, query } = criarSupabaseFake();
    const { episodio_id: _e, queixa_rotulo: _q, ...antiga } = linha;
    query.limit
      .mockResolvedValueOnce({ data: null, error: { message: 'column historico_ia.episodio_id does not exist' } })
      .mockResolvedValueOnce({ data: [antiga], error: null });

    const resultado = await new SupabaseTriagemRepository(supabase).historico('user-1');

    expect(query.select).toHaveBeenCalledTimes(2);
    expect(resultado.ok && resultado.value[0]).toEqual(expect.objectContaining({ episodioId: null, rotulo: null }));
  });

  it('"Não é isso" limpa o episódio do registro', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn(() => ({ eq }));
    const supabase = { from: jest.fn(() => ({ update })) } as unknown as SupabaseClient;

    const resultado = await new SupabaseTriagemRepository(supabase).desvincularEpisodio('5');

    expect(update).toHaveBeenCalledWith({ episodio_id: null });
    expect(eq).toHaveBeenCalledWith('id', '5');
    expect(resultado.ok).toBe(true);
  });

  it('mapeia o episódio anterior e a recorrência devolvidos pela função', async () => {
    const { supabase, invoke } = criarSupabaseFake();
    invoke.mockResolvedValue({
      data: {
        nivel: 3,
        sintomas: {},
        queixa_rotulo: 'dor de cabeça',
        relacao: 'continuacao',
        episodio: { id: 4, desde: '2026-09-30T08:00:00Z', rotulo: 'dor de cabeça' },
        recorrencia: [],
        historico_id: 5,
      },
      error: null,
    });

    const resultado = await new SupabaseTriagemRepository(supabase).analisar('agora febre');

    expect(resultado.ok && resultado.value.episodioAnterior).toEqual({
      id: '4',
      desde: '2026-09-30T08:00:00Z',
      rotulo: 'dor de cabeça',
    });
    expect(resultado.ok && resultado.value.rotulo).toBe('dor de cabeça');
  });
});
