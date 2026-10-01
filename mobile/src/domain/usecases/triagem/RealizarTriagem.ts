import type { TriagemRepository } from '@domain/repositories/TriagemRepository';
import type { TriagemLocalRepository } from '@domain/repositories/ProntuarioRepository';
import type { ComplementoTriagem } from '@domain/entities/Triagem';
import { ValidationError } from '@domain/errors';
import { err } from '@core/utils/result';

export const LIMITE_RELATO = 2000;
/** Igual ao limite da Edge Function. */
export const LIMITE_RESPOSTA = 500;

export class RealizarTriagem {
  constructor(
    private readonly repo: TriagemRepository,
    private readonly local: TriagemLocalRepository,
  ) {}

  /**
   * Primeira rodada: só o relato. Segunda rodada: o mesmo relato com as
   * respostas às perguntas da IA (respostas em branco são descartadas).
   */
  async execute(descricao: string, complemento?: ComplementoTriagem) {
    const texto = descricao.trim();
    if (texto.length < 10) {
      return err(new ValidationError('descricao', 'Descreva o que está sentindo com mais detalhes'));
    }
    if (texto.length > LIMITE_RELATO) {
      return err(new ValidationError('descricao', `O relato deve ter no máximo ${LIMITE_RELATO} caracteres`));
    }

    let segundaRodada: ComplementoTriagem | undefined;
    if (complemento) {
      const respostas = complemento.respostas
        .map((r) => ({ pergunta: r.pergunta.trim(), resposta: r.resposta.trim() }))
        .filter((r) => r.resposta !== '');
      if (respostas.length === 0) {
        return err(new ValidationError('respostas', 'Responda pelo menos uma pergunta'));
      }
      if (respostas.some((r) => r.resposta.length > LIMITE_RESPOSTA)) {
        return err(new ValidationError('respostas', `Cada resposta deve ter no máximo ${LIMITE_RESPOSTA} caracteres`));
      }
      segundaRodada = { respostas, historicoId: complemento.historicoId };
    }

    const resultado = segundaRodada ? await this.repo.analisar(texto, segundaRodada) : await this.repo.analisar(texto);

    // Guarda para o pre-prontuario aproveitar nos proximos 20 minutos.
    if (resultado.ok) {
      const { triagem } = resultado.value;
      await this.local.registrar({
        textoUsuario: texto,
        nivel: triagem.nivel,
        resumo: triagem.resumo,
        recomendacao: triagem.recomendacao,
      });
    }

    return resultado;
  }
}
