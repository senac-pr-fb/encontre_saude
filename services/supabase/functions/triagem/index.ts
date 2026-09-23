/**
 * Triagem de sintomas com IA.
 *
 * Existe para que a chave do Gemini nunca entre num cliente. O app (e, quando
 * for atualizado, o site) manda só o relato do usuário; a chave, o prompt e a
 * gravação do histórico ficam aqui.
 *
 * Deploy:
 *   supabase secrets set GEMINI_API_KEY=...
 *   supabase functions deploy triagem
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODELO = 'gemini-2.5-flash';
const LIMITE_RELATO = 2000;

// Copiado de frontend/pages/home_page/js/sintomas_ai/api.js — os nomes dos
// sintomas são exatamente as colunas de `sintomas_atendimento`.
const PROMPT_MESTRE = `
Você é um assistente de IA especializado em triagem de sintomas de saúde. Sua tarefa é analisar o relato do usuário e fornecer uma orientação estruturada.

**Instruções de Resposta:**
Você DEVE retornar sua resposta APENAS no formato JSON, sem crase ou markdown. O JSON deve conter os seguintes campos:

{
  "nivel": (número de 1 a 5),
  "resumo": "...",
  "recomendacao": "...",
  "primeiros_socorros": "...",
  "unidade_recomendada": "...",
  "sintomas": {
    "febre": boolean,
    "dor_de_cabeca": boolean,
    "tosse": boolean,
    "falta_de_ar": boolean,
    "dor_no_peito": boolean,
    "nausea_vomito": boolean,
    "diarreia": boolean,
    "dor_abdominal": boolean,
    "dor_nas_costas": boolean,
    "tontura": boolean,
    "fraqueza": boolean,
    "coriza": boolean
  }
}

**Escala de Classificação:**
1 - Não Urgente (Autocuidado)
2 - Pouco Urgente (Observação/Farmácia)
3 - Urgente (UBS/Posto de Saúde)
4 - Muito Urgente (UPA)
5 - Emergência (Hospital/SAMU 192)

**Texto do Usuário:**
[AQUI_VOCE_INSERE_O_TEXTO_DO_USUARIO]
`;

const COLUNAS_SINTOMAS = [
  'febre',
  'dor_de_cabeca',
  'tosse',
  'falta_de_ar',
  'dor_no_peito',
  'nausea_vomito',
  'diarreia',
  'dor_abdominal',
  'dor_nas_costas',
  'tontura',
  'fraqueza',
  'coriza',
] as const;

// O site roda em outro domínio; sem isto o navegador bloqueia a chamada.
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

  // 1. Só usuário autenticado. O cliente carrega o JWT de quem está logado,
  //    então as escritas abaixo continuam sujeitas às policies de RLS.
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

  // 3. Gemini, com a chave que só existe aqui
  const chave = Deno.env.get('GEMINI_API_KEY');
  if (!chave) return json({ erro: 'Serviço de triagem não configurado' }, 500);

  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${chave}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT_MESTRE.replace('[AQUI_VOCE_INSERE_O_TEXTO_DO_USUARIO]', descricao) }] }],
        // Evita as cercas ```json que o site precisava limpar na mão
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    },
  );

  if (!resposta.ok) {
    console.error('[triagem] Gemini respondeu', resposta.status, await resposta.text());
    return json({ erro: 'Não foi possível analisar os sintomas agora' }, 502);
  }

  const corpo = await resposta.json();
  const texto: string = corpo?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  let resultado: Record<string, unknown>;
  try {
    resultado = JSON.parse(texto.replace(/```json|```/g, '').trim());
  } catch {
    console.error('[triagem] resposta não era JSON:', texto.slice(0, 500));
    return json({ erro: 'Resposta da IA em formato inesperado' }, 502);
  }

  // 4. Normaliza antes de gravar: o modelo pode devolver nível fora da faixa
  //    ou omitir sintomas.
  const nivel = Math.min(5, Math.max(1, Number(resultado.nivel) || 1));
  const sintomasBrutos = (resultado.sintomas ?? {}) as Record<string, unknown>;
  const sintomas = Object.fromEntries(COLUNAS_SINTOMAS.map((c) => [c, Boolean(sintomasBrutos[c])]));

  const triagem = {
    nivel,
    resumo: String(resultado.resumo ?? ''),
    recomendacao: String(resultado.recomendacao ?? ''),
    primeiros_socorros: String(resultado.primeiros_socorros ?? ''),
    unidade_recomendada: String(resultado.unidade_recomendada ?? ''),
    sintomas,
  };

  // 5. Histórico. Falhar aqui não invalida a orientação já produzida.
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
      .insert({ historico_id: historico.id, ...sintomas });
    if (erroSintomas) console.error('[triagem] sintomas não salvos:', erroSintomas.message);
  }

  return json({ ...triagem, historico_id: historico?.id ?? null });
});
