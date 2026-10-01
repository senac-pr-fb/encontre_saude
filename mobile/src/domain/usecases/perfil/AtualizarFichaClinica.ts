import type { PerfilRepository } from '@domain/repositories/PerfilRepository';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { AnaliseTriagem, AtualizacoesFicha } from '@domain/entities/Triagem';
import { ValidationError, type DomainError } from '@domain/errors';
import { err, type Result } from '@core/utils/result';

export const ROTULOS_ATUALIZACOES: Record<keyof AtualizacoesFicha, string> = {
  alergias: 'Alergias',
  medicamentosEmUso: 'Medicamentos em uso',
  doencasPreexistentes: 'Doenças preexistentes',
  observacoes: 'Observações',
};

/** A partir de quantos episódios da mesma queixa em 6 meses vale anotar na ficha. */
export const MIN_EPISODIOS_ANOTACAO = 3;

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
 * Queixa que se repete vira sugestão de anotação nas observações da ficha
 * ("Dor de cabeça frequente: 3 episódios em 6 meses"), acrescentada ao que já
 * houver. A recorrência da Edge Function é anterior a este relato: num episódio
 * novo ele soma um; numa continuação, o episódio já foi contado.
 */
export function sugestaoDeRecorrencia(perfil: PerfilSaude, analise: AnaliseTriagem): Partial<AtualizacoesFicha> {
  const rotulo = analise.rotulo?.trim().toLowerCase();
  if (!rotulo) return {};
  const item = analise.recorrencia.find((i) => i.rotulo.toLowerCase() === rotulo);
  if (!item) return {};

  const total = item.episodios + (analise.episodioAnterior ? 0 : 1);
  if (total < MIN_EPISODIOS_ANOTACAO || normalizar(perfil.observacoes).includes(rotulo)) return {};

  const nota = `${rotulo.charAt(0).toUpperCase()}${rotulo.slice(1)} frequente: ${total} episódios em 6 meses.`;
  const atuais = perfil.observacoes?.trim();
  return { observacoes: atuais ? `${atuais}\n${nota}` : nota };
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
