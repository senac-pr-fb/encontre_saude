import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import type { InteracaoHistorico } from '@domain/entities/Triagem';
import {
  CAMPOS_OBRIGATORIOS,
  VALIDADE_TRIAGEM_DOCUMENTO_MS,
  type CampoObrigatorio,
  type ContextoSaude,
  type Episodio,
  type SituacaoDocumento,
} from '@domain/entities/ContextoSaude';
import { contextoParaFormulario, etapaDados } from '@domain/usecases/prontuario';
import { agruparEpisodios } from './episodios';

interface Entrada {
  perfil: PerfilSaude;
  fichaExiste: boolean;
  nome: string | null;
  /** Mais recente primeiro, como o repositório devolve. */
  historico: InteracaoHistorico[];
  agora?: number;
}

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

/** Além dos obrigatórios, o que mais ajuda a triagem e o atendimento. */
const CAMPOS_CLINICOS = [
  'peso',
  'altura',
  'alergias',
  'medicamentosEmUso',
  'doencasPreexistentes',
  'historicoFamiliar',
] as const satisfies readonly (keyof PerfilSaude)[];

function calcularCompletude(perfil: PerfilSaude, faltantes: CampoObrigatorio[]): number {
  const clinicos = CAMPOS_CLINICOS.filter((c) => perfil[c] !== null && String(perfil[c]).trim() !== '').length;
  const preenchidos = CAMPOS_OBRIGATORIOS.length - faltantes.length + clinicos;
  return Math.round((preenchidos / (CAMPOS_OBRIGATORIOS.length + CAMPOS_CLINICOS.length)) * 100);
}

// A validade conta do último relato do episódio: "agora febre" renova a dor de cabeça de ontem.
const valido = (e: Episodio, agora: number) => agora - Date.parse(e.fim) < VALIDADE_TRIAGEM_DOCUMENTO_MS;

export function montarContexto({ perfil, fichaExiste, nome, historico, agora = Date.now() }: Entrada): ContextoSaude {
  const episodios = agruparEpisodios(historico);
  const comTriagem = episodios.filter((e) => e.ultimaTriagem !== null);
  const episodioAtual = comTriagem[0] ?? null;
  const episodiosAtivos = comTriagem.filter((e) => valido(e, agora));
  const ultimaTriagem = episodioAtual?.ultimaTriagem ?? null;
  const triagemValida = !!episodioAtual && valido(episodioAtual, agora);
  const faltantes = camposFaltantes(perfil, nome);

  // A triagem vem primeiro: é na pré-triagem que os dados faltantes também são pedidos.
  let situacao: SituacaoDocumento = 'pronto';
  if (!ultimaTriagem) situacao = 'sem-triagem';
  else if (!triagemValida) situacao = 'triagem-vencida';
  else if (faltantes.length > 0) situacao = 'dados-faltando';

  const completude = calcularCompletude(perfil, faltantes);

  return {
    perfil,
    fichaExiste,
    nome,
    episodios,
    episodioAtual,
    episodiosAtivos,
    ultimaTriagem,
    triagemValida,
    faltantes,
    completude,
    situacao,
  };
}
