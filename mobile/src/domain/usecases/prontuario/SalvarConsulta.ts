import type { ProntuarioRepository } from '@domain/repositories/ProntuarioRepository';
import type { PerfilRepository } from '@domain/repositories/PerfilRepository';
import type { PreProntuario } from '@domain/entities/PreProntuario';
import { perfilVazio } from '@domain/entities/PerfilSaude';
import { ok, type Result } from '@core/utils/result';
import type { DomainError } from '@domain/errors';

/**
 * Conclui o pre-prontuario: grava a consulta no historico e sincroniza os
 * dados clinicos com a ficha de saude, como o site faz ao gerar o PDF.
 *
 * Diferenca importante: o site monta o upsert do perfil so com os campos do
 * formulario, apagando o resto da ficha. Aqui o perfil atual e carregado e
 * apenas os campos informados sao sobrescritos.
 */
export class SalvarConsulta {
  constructor(
    private readonly prontuarios: ProntuarioRepository,
    private readonly perfis: PerfilRepository,
  ) {}

  async execute(userId: string, p: PreProntuario): Promise<Result<void, DomainError>> {
    const consulta = await this.prontuarios.salvarConsulta(userId, p);
    if (!consulta.ok) return consulta;

    const atual = await this.perfis.getByUserId(userId);
    const base = atual.ok && atual.value ? atual.value : perfilVazio(userId);

    const manter = <T>(novo: T | null, antigo: T): T => (novo === null ? antigo : novo);

    const sincronizado = await this.perfis.upsert({
      ...base,
      sexo: p.sexo,
      cpf: p.cpf,
      dataNascimento: p.dataNascimento,
      telefone: p.telefone,
      peso: manter(p.peso, base.peso),
      altura: manter(p.altura, base.altura),
      alergias: manter(p.alergias, base.alergias),
      medicamentosEmUso: manter(p.medicamentosEmUso, base.medicamentosEmUso),
      doencasPreexistentes: manter(p.doencasPreexistentes, base.doencasPreexistentes),
      historicoFamiliar: manter(p.historicoFamiliar, base.historicoFamiliar),
      observacoes: manter(p.observacoes, base.observacoes),
      sinaisVitais: {
        pressaoArterial: manter(p.pressaoArterial, base.sinaisVitais.pressaoArterial),
        frequenciaCardiaca: manter(p.frequenciaCardiaca, base.sinaisVitais.frequenciaCardiaca),
        temperatura: manter(p.temperatura, base.sinaisVitais.temperatura),
        saturacaoOxigenio: manter(p.saturacaoOxigenio, base.sinaisVitais.saturacaoOxigenio),
      },
    });

    // A consulta ja foi gravada; falha na sincronia do perfil nao invalida o PDF.
    if (!sincronizado.ok) return ok(undefined);
    return ok(undefined);
  }
}
