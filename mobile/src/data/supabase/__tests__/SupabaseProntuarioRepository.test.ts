import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseProntuarioRepository } from '../SupabaseProntuarioRepository';
import { SINTOMAS, type PreProntuario } from '@domain/entities/PreProntuario';

const preProntuario: PreProntuario = {
  nome: 'João da Silva',
  dataNascimento: '2001-04-25',
  cpf: '12345678901',
  sexo: 'Masculino',
  telefone: '11987654321',
  queixaPrincipal: 'Dor de cabeça forte',
  tempoSintoma: '2 dias',
  sintomas: ['febre', 'tosse'],
  alergias: null,
  medicamentosEmUso: null,
  doencasPreexistentes: null,
  historicoFamiliar: null,
  pressaoArterial: null,
  frequenciaCardiaca: null,
  temperatura: null,
  saturacaoOxigenio: null,
  peso: 70,
  altura: 1.75,
  observacoes: null,
};

interface HistoricoQueryFake {
  insert: jest.Mock;
  select: jest.Mock;
  single: jest.Mock;
}

function criarSupabaseFake(opts: {
  historico: { data: unknown; error: unknown };
  sintomas: { error: unknown };
}) {
  const historicoQuery: HistoricoQueryFake = {
    insert: jest.fn(() => historicoQuery),
    select: jest.fn(() => historicoQuery),
    single: jest.fn().mockResolvedValue(opts.historico),
  };
  const sintomasQuery = { insert: jest.fn().mockResolvedValue(opts.sintomas) };
  const from = jest.fn((tabela: string) => (tabela === 'historico_ia' ? historicoQuery : sintomasQuery));
  return { supabase: { from } as unknown as SupabaseClient, historicoQuery, sintomasQuery, from };
}

describe('SupabaseProntuarioRepository.salvarConsulta', () => {
  it('grava o histórico e os sintomas marcados', async () => {
    const { supabase, historicoQuery, sintomasQuery } = criarSupabaseFake({
      historico: { data: { id: 'hist-1' }, error: null },
      sintomas: { error: null },
    });

    const resultado = await new SupabaseProntuarioRepository(supabase).salvarConsulta('user-1', preProntuario);

    expect(historicoQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        descricao_usuario: 'Dor de cabeça forte',
        dados_clinicos: expect.objectContaining({ peso: 70, altura: 1.75, tempo_sintoma: '2 dias' }),
      }),
    );

    const marcadosEsperados = Object.fromEntries(SINTOMAS.map((s) => [s.coluna, preProntuario.sintomas.includes(s.coluna)]));
    expect(sintomasQuery.insert).toHaveBeenCalledWith({ historico_id: 'hist-1', ...marcadosEsperados });
    expect(resultado).toEqual({ ok: true, value: undefined });
  });

  it('retorna erro e não grava sintomas quando o histórico falha', async () => {
    const { supabase, sintomasQuery } = criarSupabaseFake({
      historico: { data: null, error: { message: 'falha ao gravar histórico' } },
      sintomas: { error: null },
    });

    const resultado = await new SupabaseProntuarioRepository(supabase).salvarConsulta('user-1', preProntuario);

    expect(sintomasQuery.insert).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
  });

  it('retorna sucesso mesmo quando gravar os sintomas falha (histórico já foi salvo)', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { supabase } = criarSupabaseFake({
      historico: { data: { id: 'hist-1' }, error: null },
      sintomas: { error: { message: 'falha ao gravar sintomas' } },
    });

    const resultado = await new SupabaseProntuarioRepository(supabase).salvarConsulta('user-1', preProntuario);

    expect(resultado).toEqual({ ok: true, value: undefined });
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});
