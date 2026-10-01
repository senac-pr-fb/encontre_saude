import type { PerfilRepository } from '@domain/repositories/PerfilRepository';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { AtualizacoesFicha } from '@domain/entities/Triagem';
import { ValidationError, type DomainError } from '@domain/errors';
import { err, type Result } from '@core/utils/result';

export const ROTULOS_ATUALIZACOES: Record<keyof AtualizacoesFicha, string> = {
  alergias: 'Alergias',
  medicamentosEmUso: 'Medicamentos em uso',
  doencasPreexistentes: 'Doenças preexistentes',
};

const normalizar = (s: string | null) => (s ?? '').trim().toLowerCase();

/**
 * Das sugestões da IA, só o que mudaria a ficha: valor informado e diferente do
 * atual. É o que aparece para o paciente confirmar.
 */
export function sugestoesParaFicha(a: AtualizacoesFicha, perfil: PerfilSaude): Partial<AtualizacoesFicha> {
  const sugestoes: Partial<AtualizacoesFicha> = {};
  for (const campo of Object.keys(ROTULOS_ATUALIZACOES) as (keyof AtualizacoesFicha)[]) {
    const novo = a[campo]?.trim();
    if (novo && normalizar(novo) !== normalizar(perfil[campo])) sugestoes[campo] = novo;
  }
  return sugestoes;
}

/**
 * Grava na ficha os dados clínicos que o paciente confirmou depois da
 * pré-triagem. A IA nunca grava direto: só chega aqui o que ele aceitou.
 */
export class AtualizarFichaClinica {
  constructor(private readonly perfis: PerfilRepository) {}

  async execute(userId: string, dados: Partial<AtualizacoesFicha>): Promise<Result<PerfilSaude, DomainError>> {
    const campos = (Object.keys(ROTULOS_ATUALIZACOES) as (keyof AtualizacoesFicha)[]).filter((c) => dados[c]?.trim());
    if (campos.length === 0) return err(new ValidationError('ficha', 'Nada para atualizar'));

    const atual = await this.perfis.getByUserId(userId);
    if (!atual.ok) return atual;
    const base = atual.value ?? perfilVazio(userId);

    const novos = Object.fromEntries(campos.map((c) => [c, dados[c]!.trim()]));
    return this.perfis.upsert({ ...base, ...novos });
  }
}
