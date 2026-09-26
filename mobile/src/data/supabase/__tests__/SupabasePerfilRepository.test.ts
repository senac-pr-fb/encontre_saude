import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabasePerfilRepository } from '../SupabasePerfilRepository';
import { perfilVazio } from '@domain/entities/PerfilSaude';
import { perfilMapper } from '@data/mappers/perfilMapper';
import type { DadosSaudeDTO } from '@data/dto/DadosSaudeDTO';

const dto: DadosSaudeDTO = {
  user_id: 'user-1',
  idade: 30,
  peso: 70,
  altura: 1.75,
  sexo: 'Masculino',
  CPF: '12345678901',
  data_nascimento: '2001-04-25',
  telefone: '11987654321',
  fuma: false,
  bebe: false,
  alergias: null,
  alergia_medicamento: null,
  medicamentos_em_uso: null,
  doencas_preexistentes: null,
  historico_familiar: null,
  possui_deficiencia: null,
  contato_medico_particular: null,
  pressao_arterial: null,
  frequencia_cardiaca: null,
  temperatura: null,
  saturacao_oxigenio: null,
  observacoes: null,
};

interface QueryFake {
  select: jest.Mock;
  eq: jest.Mock;
  upsert: jest.Mock;
  single: jest.Mock;
}

function criarSupabaseFake(respostaFinal: { data: unknown; error: unknown }) {
  const query: QueryFake = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    upsert: jest.fn(() => query),
    single: jest.fn().mockResolvedValue(respostaFinal),
  };
  const from = jest.fn().mockReturnValue(query);
  return { supabase: { from } as unknown as SupabaseClient, query, from };
}

describe('SupabasePerfilRepository.getByUserId', () => {
  it('devolve o perfil mapeado quando a linha existe', async () => {
    const { supabase, from } = criarSupabaseFake({ data: dto, error: null });

    const resultado = await new SupabasePerfilRepository(supabase).getByUserId('user-1');

    expect(from).toHaveBeenCalledWith('dados_saude');
    expect(resultado).toEqual({ ok: true, value: perfilMapper.toEntity(dto) });
  });

  it('devolve null (sem erro) quando o Postgres não encontra a linha (PGRST116)', async () => {
    const { supabase } = criarSupabaseFake({ data: null, error: { message: 'sem linha', code: 'PGRST116' } });

    const resultado = await new SupabasePerfilRepository(supabase).getByUserId('user-1');

    expect(resultado).toEqual({ ok: true, value: null });
  });

  it('propaga outros erros do Postgres', async () => {
    const { supabase } = criarSupabaseFake({ data: null, error: { message: 'erro de conexão', code: 'OUTRO' } });

    const resultado = await new SupabasePerfilRepository(supabase).getByUserId('user-1');

    expect(resultado.ok).toBe(false);
  });
});

describe('SupabasePerfilRepository.upsert', () => {
  it('grava o perfil convertido para DTO e devolve a entidade atualizada', async () => {
    const { supabase, query } = criarSupabaseFake({ data: dto, error: null });
    const perfil = perfilMapper.toEntity(dto);

    const resultado = await new SupabasePerfilRepository(supabase).upsert(perfil);

    expect(query.upsert).toHaveBeenCalledWith(perfilMapper.toDTO(perfil), { onConflict: 'user_id' });
    expect(resultado).toEqual({ ok: true, value: perfilMapper.toEntity(dto) });
  });

  it('propaga erro do Supabase ao gravar', async () => {
    const { supabase } = criarSupabaseFake({ data: null, error: { message: 'falha ao gravar' } });

    const resultado = await new SupabasePerfilRepository(supabase).upsert(perfilVazio('user-1'));

    expect(resultado.ok).toBe(false);
  });
});
