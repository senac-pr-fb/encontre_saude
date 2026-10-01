import type { PerfilRepository } from '@domain/repositories/PerfilRepository';
import type { AuthRepository } from '@domain/repositories/AuthRepository';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import { CAMPOS_OBRIGATORIOS, type CampoObrigatorio } from '@domain/entities/ContextoSaude';
import { ValidationError, type DomainError } from '@domain/errors';
import { err, ok, type Result } from '@core/utils/result';
import { etapaDados, type ProntuarioFormInput } from '@domain/usecases/prontuario';

/** Só os obrigatórios que a pessoa preencheu, como o formulário entrega (texto com máscara). */
export type DadosObrigatorios = Partial<Pick<ProntuarioFormInput, CampoObrigatorio>>;

/**
 * Grava na ficha apenas os obrigatórios que faltavam, sem passar pelo
 * formulário inteiro. Valida com as regras da etapa 1 do pré-prontuário e
 * mantém o resto da ficha como está. O nome vai para a conta, não para a ficha.
 */
export class CompletarObrigatorios {
  constructor(
    private readonly perfis: PerfilRepository,
    private readonly auth: AuthRepository,
  ) {}

  async execute(userId: string, entrada: DadosObrigatorios): Promise<Result<PerfilSaude, DomainError>> {
    const campos = CAMPOS_OBRIGATORIOS.filter((c) => entrada[c] !== undefined);
    const mascara = Object.fromEntries(campos.map((c) => [c, true])) as Record<CampoObrigatorio, true>;

    const parsed = etapaDados.pick(mascara).safeParse(entrada);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(new ValidationError(issue.path.join('.'), issue.message));
    }
    const v: Partial<typeof parsed.data> = parsed.data;

    if (v.nome !== undefined) {
      const nome = await this.auth.atualizarNome(v.nome);
      if (!nome.ok) return nome;
    }

    // Relê a ficha: o que estiver em memória na tela pode estar desatualizado.
    const atual = await this.perfis.getByUserId(userId);
    if (!atual.ok) return atual;
    const base = atual.value ?? perfilVazio(userId);

    if (!campos.some((c) => c !== 'nome')) return ok(base);

    return this.perfis.upsert({
      ...base,
      ...(v.dataNascimento !== undefined && { dataNascimento: v.dataNascimento }),
      ...(v.cpf !== undefined && { cpf: v.cpf }),
      ...(v.sexo !== undefined && { sexo: v.sexo }),
      ...(v.telefone !== undefined && { telefone: v.telefone.trim() }),
    });
  }
}
