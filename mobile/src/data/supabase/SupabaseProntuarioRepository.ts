import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProntuarioRepository } from '@domain/repositories/ProntuarioRepository';
import type { PreProntuario } from '@domain/entities/PreProntuario';
import { SINTOMAS } from '@domain/entities/PreProntuario';
import type { DomainError } from '@domain/errors';
import { ok, err, type Result } from '@core/utils/result';
import { toDomainError } from './errors';

const RESPOSTA_PADRAO = 'Pré-Prontuário gerado manualmente pelo usuário.';

export class SupabaseProntuarioRepository implements ProntuarioRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async salvarConsulta(userId: string, p: PreProntuario): Promise<Result<void, DomainError>> {
    // 1. Histórico, com os dados clínicos em jsonb (mesma estrutura do site)
    const { data, error } = await this.supabase
      .from('historico_ia')
      .insert({
        user_id: userId,
        descricao_usuario: p.queixaPrincipal,
        resposta_ia: RESPOSTA_PADRAO,
        dados_clinicos: {
          tempo_sintoma: p.tempoSintoma,
          alergias: p.alergias,
          medicamentos: p.medicamentosEmUso,
          doencas: p.doencasPreexistentes,
          historico_familiar: p.historicoFamiliar,
          pressao: p.pressaoArterial,
          frequencia_cardiaca: p.frequenciaCardiaca,
          temperatura: p.temperatura,
          saturacao: p.saturacaoOxigenio,
          peso: p.peso,
          altura: p.altura,
          observacoes: p.observacoes,
        },
      })
      .select('id')
      .single();

    if (error) return err(toDomainError(error));

    // 2. Sintomas: uma coluna booleana por sintoma, todas preenchidas
    const marcados = Object.fromEntries(SINTOMAS.map((s) => [s.coluna, p.sintomas.includes(s.coluna)]));

    const { error: erroSintomas } = await this.supabase
      .from('sintomas_atendimento')
      .insert({ historico_id: data.id, ...marcados });

    // O histórico já está salvo; perder os sintomas não invalida a consulta.
    if (erroSintomas) console.warn('[prontuario] sintomas não salvos:', erroSintomas.message);

    return ok(undefined);
  }
}
