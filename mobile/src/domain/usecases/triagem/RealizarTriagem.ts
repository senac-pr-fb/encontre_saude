import type { TriagemRepository } from '@domain/repositories/TriagemRepository';
import type { TriagemLocalRepository } from '@domain/repositories/ProntuarioRepository';
import { ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';

export const LIMITE_RELATO = 2000;

export class RealizarTriagem {
  constructor(
    private readonly repo: TriagemRepository,
    private readonly local: TriagemLocalRepository,
  ) {}

  async execute(descricao: string) {
    const texto = descricao.trim();
    if (texto.length < 10) {
      return err(new ValidationError('descricao', 'Descreva o que está sentindo com mais detalhes'));
    }
    if (texto.length > LIMITE_RELATO) {
      return err(new ValidationError('descricao', `O relato deve ter no máximo ${LIMITE_RELATO} caracteres`));
    }

    const resultado = await this.repo.analisar(texto);

    // Guarda para o pre-prontuario aproveitar nos proximos 20 minutos.
    if (resultado.ok) {
      await this.local.registrar({
        textoUsuario: texto,
        nivel: resultado.value.nivel,
        resumo: resultado.value.resumo,
        recomendacao: resultado.value.recomendacao,
      });
    }

    return resultado;
  }
}
