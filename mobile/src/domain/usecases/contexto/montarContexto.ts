import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import type { InteracaoHistorico } from '@domain/entities/Triagem';
import {
  CAMPOS_OBRIGATORIOS,
  VALIDADE_TRIAGEM_DOCUMENTO_MS,
  type CampoObrigatorio,
  type ContextoSaude,
  type SituacaoDocumento,
  type TriagemDoHistorico,
} from '@domain/entities/ContextoSaude';
import { contextoParaFormulario, etapaDados } from '@domain/usecases/prontuario';

interface Entrada {
  perfil: PerfilSaude;
  fichaExiste: boolean;
  nome: string | null;
  /** Mais recente primeiro, como o repositório devolve. */
  historico: InteracaoHistorico[];
  agora?: number;
}

const temTriagem = (i: InteracaoHistorico): i is TriagemDoHistorico => i.triagem !== null;

/**
 * Obrigatórios que a ficha não cobre. Usa as regras da etapa 1 do formulário,
 * então "faltando" aqui é exatamente o que travaria o usuário lá.
 */
function camposFaltantes(perfil: PerfilSaude, nome: string | null): CampoObrigatorio[] {
  const form = contextoParaFormulario(perfil, nome);
  // O formulário assume um sexo padrão; aqui a ausência precisa aparecer.
  const resultado = etapaDados.safeParse({ ...form, sexo: perfil.sexo ?? undefined });
  if (resultado.success) return [];

  const comErro = new Set(resultado.error.issues.map((i) => i.path[0]));
  return CAMPOS_OBRIGATORIOS.filter((c) => comErro.has(c));
}

export function montarContexto({ perfil, fichaExiste, nome, historico, agora = Date.now() }: Entrada): ContextoSaude {
  const ultimaTriagem = historico.find(temTriagem) ?? null;
  const quando = ultimaTriagem ? Date.parse(ultimaTriagem.quando) : NaN;
  const triagemValida = Number.isFinite(quando) && agora - quando < VALIDADE_TRIAGEM_DOCUMENTO_MS;
  const faltantes = camposFaltantes(perfil, nome);

  // A triagem vem primeiro: é na pré-triagem que os dados faltantes também são pedidos.
  let situacao: SituacaoDocumento = 'pronto';
  if (!ultimaTriagem) situacao = 'sem-triagem';
  else if (!triagemValida) situacao = 'triagem-vencida';
  else if (faltantes.length > 0) situacao = 'dados-faltando';

  return { perfil, fichaExiste, nome, ultimaTriagem, triagemValida, faltantes, situacao };
}
