/**
 * Triagem de sintomas com IA.
 *
 * Existe para que a chave do modelo nunca entre num cliente. O app (e, quando
 * for atualizado, o site) manda só o relato do usuário; a chave, o prompt e a
 * gravação do histórico ficam aqui.
 *
 * Deploy:
 *   supabase secrets set ANTHROPIC_API_KEY=...
 *   supabase functions deploy triagem
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.128.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@^0.128.0/helpers/zod';
import { z } from 'npm:zod@^4';

const MODELO = 'claude-opus-5';
const LIMITE_RELATO = 2000;

/**
 * O formato da resposta é imposto pelo schema, não pedido no prompt: o modelo
 * não consegue devolver outra coisa. Isso dispensa o que o site precisa fazer
 * na mão — limpar cercas ```json, tratar campo ausente, validar o nível.
 *
 * As chaves de `sintomas` são exatamente as colunas de `sintomas_atendimento`.
 */
const TriagemSchema = z.object({
  nivel: z.number().int().min(1).max(5).describe('1 Não Urgente, 2 Pouco Urgente, 3 Urgente, 4 Muito Urgente, 5 Emergência'),
  resumo: z.string().describe('Uma a duas frases sobre o que o relato indica, em linguagem simples'),
  recomendacao: z.string().describe('O que a pessoa deve fazer agora, de forma direta'),
  primeiros_socorros: z.string().describe('Cuidados imediatos possíveis em casa; string vazia se não houver'),
  unidade_recomendada: z.string().describe('Onde procurar atendimento: autocuidado, farmácia, UBS, UPA ou hospital'),
  sintomas: z.object({
    febre: z.boolean(),
    dor_de_cabeca: z.boolean(),
    tosse: z.boolean(),
    falta_de_ar: z.boolean(),
    dor_no_peito: z.boolean(),
    nausea_vomito: z.boolean(),
    diarreia: z.boolean(),
    dor_abdominal: z.boolean(),
    dor_nas_costas: z.boolean(),
    tontura: z.boolean(),
    fraqueza: z.boolean(),
    coriza: z.boolean(),
  }),
});

const INSTRUCOES = `Você é um assistente de triagem de sintomas de um aplicativo de saúde pública de Francisco Beltrão, no Paraná.

Analise o relato e classifique a urgência nesta escala:
1 - Não Urgente: autocuidado em casa
2 - Pouco Urgente: observação, orientação de farmácia
3 - Urgente: UBS ou posto de saúde
4 - Muito Urgente: UPA
5 - Emergência: hospital ou SAMU 192

Marque em "sintomas" apenas o que o relato menciona ou implica claramente — não presuma.

Escreva para quem não tem formação em saúde: frases curtas, sem jargão. Não invente diagnóstico: o objetivo é orientar para onde ir, não dizer o que a pessoa tem. Na dúvida entre dois níveis, escolha o mais alto — errar para o lado cauteloso é preferível.`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ erro: 'Método não permitido' }, 405);

  // 1. Só usuário autenticado. O cliente carrega o JWT de quem chamou, então as
  //    gravações abaixo continuam sujeitas às policies de RLS.
  const autorizacao = req.headers.get('Authorization');
  if (!autorizacao) return json({ erro: 'Não autenticado' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: autorizacao } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ erro: 'Não autenticado' }, 401);

  // 2. Entrada
  let descricao: unknown;
  try {
    ({ descricao } = await req.json());
  } catch {
    return json({ erro: 'Corpo inválido' }, 400);
  }

  if (typeof descricao !== 'string' || descricao.trim().length < 3) {
    return json({ erro: 'Descreva os sintomas com mais detalhes' }, 400);
  }
  if (descricao.length > LIMITE_RELATO) {
    return json({ erro: `O relato deve ter no máximo ${LIMITE_RELATO} caracteres` }, 400);
  }

  // 3. Claude, com a chave que só existe aqui
  const chave = Deno.env.get('ANTHROPIC_API_KEY');
  if (!chave) return json({ erro: 'Serviço de triagem não configurado' }, 500);

  const anthropic = new Anthropic({ apiKey: chave });

  let triagem: z.infer<typeof TriagemSchema>;
  try {
    const resposta = await anthropic.messages.parse({
      model: MODELO,
      // A saída é curta e de formato fixo; não há por que reservar mais.
      max_tokens: 2000,
      system: INSTRUCOES,
      // Classificação sobre um texto curto não exige raciocínio profundo.
      output_config: { effort: 'low', format: zodOutputFormat(TriagemSchema) },
      messages: [{ role: 'user', content: `Relato do paciente:\n\n${descricao}` }],
    });

    // O modelo pode recusar por segurança; sem isto, leríamos conteúdo vazio.
    if (resposta.stop_reason === 'refusal') {
      console.error('[triagem] recusa:', resposta.stop_details);
      return json({ erro: 'Não foi possível analisar este relato. Procure atendimento se os sintomas persistirem.' }, 422);
    }
    if (!resposta.parsed_output) {
      console.error('[triagem] resposta sem saída estruturada:', resposta.stop_reason);
      return json({ erro: 'Resposta da IA em formato inesperado' }, 502);
    }

    triagem = resposta.parsed_output;
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      console.error('[triagem] chave inválida');
      return json({ erro: 'Serviço de triagem não configurado' }, 500);
    }
    if (e instanceof Anthropic.RateLimitError) {
      return json({ erro: 'Muitas consultas agora. Tente de novo em instantes' }, 429);
    }
    console.error('[triagem] falha na chamada:', e);
    return json({ erro: 'Não foi possível analisar os sintomas agora' }, 502);
  }

  // 4. Histórico. Falhar aqui não invalida a orientação já produzida.
  const { data: historico, error: erroHistorico } = await supabase
    .from('historico_ia')
    .insert({
      user_id: user.id,
      descricao_usuario: descricao,
      resposta_ia: JSON.stringify(triagem),
    })
    .select('id')
    .single();

  if (erroHistorico) {
    console.error('[triagem] histórico não salvo:', erroHistorico.message);
  } else {
    const { error: erroSintomas } = await supabase
      .from('sintomas_atendimento')
      .insert({ historico_id: historico.id, ...triagem.sintomas });
    if (erroSintomas) console.error('[triagem] sintomas não salvos:', erroSintomas.message);
  }

  return json({ ...triagem, historico_id: historico?.id ?? null });
});
