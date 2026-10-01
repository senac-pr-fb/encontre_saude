/**
 * A única parte da função que conhece o provedor de IA (hoje, o Gemini).
 * Trocar de provedor é trocar este arquivo: o index só vê `analisarComModelo`.
 */
import { GoogleGenAI } from 'npm:@google/genai@^2.25.0';
import { z } from 'npm:zod@^4';
import { TriagemSchema, type Triagem } from './schema.ts';

/** Configurável sem novo deploy de código: `supabase secrets set GEMINI_MODEL=...`. */
const MODELO_PADRAO = 'gemini-3.8-flash';

export type ResultadoModelo =
  | { ok: true; triagem: Triagem }
  | { ok: false; status: number; erro: string };

const falha = (status: number, erro: string): ResultadoModelo => ({ ok: false, status, erro });

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
const SCHEMA = schemaParaGemini();

/** O SDK tem classes de erro diferentes por API; o que importa aqui é o código HTTP. */
function statusDoErro(e: unknown): number | null {
  const erro = e as { status?: unknown; statusCode?: unknown } | null;
  const status = Number(erro?.status ?? erro?.statusCode);
  return Number.isFinite(status) ? status : null;
}

export async function analisarComModelo(instrucoes: string, conteudo: string): Promise<ResultadoModelo> {
  // A chave só existe aqui, como secret da função.
  const chave = Deno.env.get('GEMINI_API_KEY');
  if (!chave) return falha(500, 'Serviço de triagem não configurado');

  const ai = new GoogleGenAI({ apiKey: chave });

  let interacao;
  try {
    interacao = await ai.interactions.create({
      model: Deno.env.get('GEMINI_MODEL') || MODELO_PADRAO,
      system_instruction: instrucoes,
      input: conteudo,
      // Médio, não baixo: além de classificar o nível, o modelo decide se o relato
      // continua um episódio recente e lê a recorrência — vale pensar um pouco mais.
      generation_config: { thinking_level: 'medium' },
      response_format: { type: 'text', mime_type: 'application/json', schema: SCHEMA },
      // Nada a reaproveitar entre chamadas: não guardar a conversa no provedor.
      store: false,
    });
  } catch (e) {
    const status = statusDoErro(e);
    if (status === 401 || status === 403) {
      console.error('[triagem] chave do Gemini inválida ou sem permissão');
      return falha(500, 'Serviço de triagem não configurado');
    }
    if (status === 429) return falha(429, 'Muitas consultas agora. Tente de novo em instantes');
    console.error('[triagem] falha na chamada:', e);
    return falha(502, 'Não foi possível analisar os sintomas agora');
  }

  // Bloqueio de segurança ou resposta interrompida: não há o que ler.
  if (interacao.status !== 'completed') {
    console.error('[triagem] interação não concluída:', interacao.status);
    return falha(422, 'Não foi possível analisar este relato. Procure atendimento se os sintomas persistirem.');
  }

  let bruto: unknown;
  try {
    bruto = JSON.parse(interacao.output_text ?? '');
  } catch {
    console.error('[triagem] resposta não é JSON');
    return falha(502, 'Resposta da IA em formato inesperado');
  }

  const validado = TriagemSchema.safeParse(bruto);
  if (!validado.success) {
    console.error('[triagem] resposta fora do schema:', validado.error.issues[0]);
    return falha(502, 'Resposta da IA em formato inesperado');
  }
  return { ok: true, triagem: validado.data };
}
