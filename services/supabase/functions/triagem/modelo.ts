/**
 * A única parte da função que conhece o provedor de IA. Dois provedores, com o
 * mesmo schema e as mesmas mensagens; o index só vê `analisarComModelo`.
 *
 * Qual responde é escolhido pelo secret IA_PROVEDOR, sem deploy de código:
 *   supabase secrets set IA_PROVEDOR=anthropic   (ou gemini, o padrão)
 */
import { GoogleGenAI } from 'npm:@google/genai@^2.25.0';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.128.0';
import { betaZodOutputFormat } from 'npm:@anthropic-ai/sdk@^0.128.0/helpers/beta/zod';
import { z } from 'npm:zod@^4';
import { TriagemSchema, type Triagem } from './schema.ts';

/** Também configuráveis por secret: GEMINI_MODEL e ANTHROPIC_MODEL. */
const MODELO_GEMINI = 'gemini-3.8-flash';
const MODELO_ANTHROPIC = 'claude-opus-5-5';

export type Provedor = 'gemini' | 'anthropic';

export type ResultadoModelo =
  | { ok: true; triagem: Triagem }
  | { ok: false; status: number; erro: string };

const falha = (status: number, erro: string): ResultadoModelo => ({ ok: false, status, erro });

const NAO_CONFIGURADO = 'Serviço de triagem não configurado';
const RECUSADO = 'Não foi possível analisar este relato. Procure atendimento se os sintomas persistirem.';
const FORMATO = 'Resposta da IA em formato inesperado';

/**
 * JSON Schema enviado ao Gemini. Ficam de fora o `$schema` e os limites
 * numéricos (o nível 1–5), que não constam entre os recursos documentados: o
 * intervalo vai na descrição do campo e é conferido pelo Zod na volta.
 */
function schemaParaGemini(): Record<string, unknown> {
  const semLimites = (no: unknown): unknown => {
    if (Array.isArray(no)) return no.map(semLimites);
    if (!no || typeof no !== 'object') return no;
    return Object.fromEntries(
      Object.entries(no as Record<string, unknown>)
        .filter(([chave]) => !['$schema', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum'].includes(chave))
        .map(([chave, valor]) => [chave, semLimites(valor)]),
    );
  };
  return semLimites(z.toJSONSchema(TriagemSchema)) as Record<string, unknown>;
}

// Calculado uma vez: o schema não muda entre chamadas.
const SCHEMA_GEMINI = schemaParaGemini();

/** Os SDKs têm classes de erro diferentes; o que importa aqui é o código HTTP. */
function statusDoErro(e: unknown): number | null {
  const erro = e as { status?: unknown; statusCode?: unknown } | null;
  const status = Number(erro?.status ?? erro?.statusCode);
  return Number.isFinite(status) ? status : null;
}

/** Mesmo tratamento para os dois provedores: o usuário nunca vê detalhe interno. */
function falhaDaChamada(e: unknown, provedor: Provedor): ResultadoModelo {
  const status = statusDoErro(e);
  if (status === 401 || status === 403) {
    console.error(`[triagem] chave de ${provedor} inválida ou sem permissão`);
    return falha(500, NAO_CONFIGURADO);
  }
  if (status === 429) return falha(429, 'Muitas consultas agora. Tente de novo em instantes');
  console.error(`[triagem] falha na chamada (${provedor}):`, e);
  return falha(502, 'Não foi possível analisar os sintomas agora');
}

function validar(bruto: unknown): ResultadoModelo {
  const validado = TriagemSchema.safeParse(bruto);
  if (!validado.success) {
    console.error('[triagem] resposta fora do schema:', validado.error.issues[0]);
    return falha(502, FORMATO);
  }
  return { ok: true, triagem: validado.data };
}

type ParametrosGemini = Parameters<GoogleGenAI['interactions']['create']>[0];
type ParametrosClaude = Parameters<Anthropic['beta']['messages']['parse']>[0];
interface RespostaClaude {
  stop_reason: string | null;
  stop_details?: unknown;
  parsed_output?: unknown;
}

/** O que a função precisa do mundo de fora. Os testes trocam por versões falsas. */
export interface Dependencias {
  env: (nome: string) => string | undefined;
  criarInteracao: (chave: string, params: ParametrosGemini) => Promise<{ status: string; output_text?: string }>;
  chamarClaude: (chave: string, params: ParametrosClaude) => Promise<RespostaClaude>;
}

const dependenciasReais: Dependencias = {
  env: (nome) => Deno.env.get(nome),
  criarInteracao: (chave, params) =>
    new GoogleGenAI({ apiKey: chave }).interactions.create(params) as Promise<{ status: string; output_text?: string }>,
  chamarClaude: (chave, params) => new Anthropic({ apiKey: chave }).beta.messages.parse(params),
};

/** IA_PROVEDOR vazio ou desconhecido cai no Gemini, o padrão. */
export function provedorEscolhido(env: Dependencias['env']): Provedor {
  return env('IA_PROVEDOR')?.trim().toLowerCase() === 'anthropic' ? 'anthropic' : 'gemini';
}

async function analisarComGemini(instrucoes: string, conteudo: string, deps: Dependencias): Promise<ResultadoModelo> {
  // A chave só existe aqui, como secret da função.
  const chave = deps.env('GEMINI_API_KEY')?.trim();
  if (!chave) return falha(500, NAO_CONFIGURADO);

  let interacao;
  try {
    interacao = await deps.criarInteracao(chave, {
      model: deps.env('GEMINI_MODEL') || MODELO_GEMINI,
      system_instruction: instrucoes,
      input: conteudo,
      // Médio, não baixo: além de classificar o nível, o modelo decide se o relato
      // continua um episódio recente e lê a recorrência — vale pensar um pouco mais.
      generation_config: { thinking_level: 'medium' },
      response_format: { type: 'text', mime_type: 'application/json', schema: SCHEMA_GEMINI },
      // Nada a reaproveitar entre chamadas: não guardar a conversa no provedor.
      store: false,
      stream: false,
    });
  } catch (e) {
    return falhaDaChamada(e, 'gemini');
  }

  // Bloqueio de segurança ou resposta interrompida: não há o que ler.
  if (interacao.status !== 'completed') {
    console.error('[triagem] interação não concluída:', interacao.status);
    return falha(422, RECUSADO);
  }

  let bruto: unknown;
  try {
    bruto = JSON.parse(interacao.output_text ?? '');
  } catch {
    console.error('[triagem] resposta não é JSON');
    return falha(502, FORMATO);
  }
  return validar(bruto);
}

async function analisarComClaude(instrucoes: string, conteudo: string, deps: Dependencias): Promise<ResultadoModelo> {
  const chave = deps.env('ANTHROPIC_API_KEY')?.trim();
  if (!chave) return falha(500, NAO_CONFIGURADO);

  let resposta;
  try {
    resposta = await deps.chamarClaude(chave, {
      model: deps.env('ANTHROPIC_MODEL') || MODELO_ANTHROPIC,
      max_tokens: 16000,
      system: instrucoes,
      // Classificação sobre um texto curto: esforço baixo basta. O formato é imposto
      // pelo schema (o SDK valida na volta); os limites que a API não aplica ele confere.
      output_config: { effort: 'low', format: betaZodOutputFormat(TriagemSchema) },
      messages: [{ role: 'user', content: conteudo }],
      // Se o modelo recusar por um filtro de segurança, o servidor tenta outro modelo
      // adequado à categoria da recusa, em vez de devolver nada.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (e) {
    return falhaDaChamada(e, 'anthropic');
  }

  // Recusou mesmo depois do fallback: sem isto, leríamos conteúdo vazio.
  if (resposta.stop_reason === 'refusal') {
    console.error('[triagem] recusa:', resposta.stop_details);
    return falha(422, RECUSADO);
  }
  if (!resposta.parsed_output) {
    console.error('[triagem] resposta sem saída estruturada:', resposta.stop_reason);
    return falha(502, FORMATO);
  }
  return validar(resposta.parsed_output);
}

export function analisarComModelo(
  instrucoes: string,
  conteudo: string,
  deps: Dependencias = dependenciasReais,
): Promise<ResultadoModelo> {
  return provedorEscolhido(deps.env) === 'anthropic'
    ? analisarComClaude(instrucoes, conteudo, deps)
    : analisarComGemini(instrucoes, conteudo, deps);
}
