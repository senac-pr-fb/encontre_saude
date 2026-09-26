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
  it('mapeia a resposta da Edge Function para a entidade Triagem', async () => {
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
        nivel: 3,
        resumo: 'Sintomas significativos',
        recomendacao: 'Procure atendimento',
        primeirosSocorros: 'Descanse',
        unidadeRecomendada: 'UPA',
        sintomas: ['febre'],
      },
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
    if (resultado.ok) expect(resultado.value.nivel).toBe(1);
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
