/**
 * Triagem de sintomas com IA.
 *
 * Existe para que a chave do modelo nunca entre num cliente. O app (e, quando
 * for atualizado, o site) manda só o relato do usuário; a chave, o prompt e a
 * gravação do histórico ficam aqui.
 *
 * Duas rodadas, ambas opcionais além da primeira:
 *  1. `{ descricao }`: analisa o relato com a ficha de saúde do usuário como
 *     contexto e pode devolver `perguntas` curtas sobre o que falta.
 *  2. `{ descricao, respostas, historico_id }`: reanalisa com as respostas e
 *     atualiza o mesmo registro do histórico.
 * Quem manda só `descricao` recebe tudo o que já recebia; os campos novos são
 * acréscimos.
 *
 * Privacidade: da ficha, só os dados clínicos entram no prompt. Nome, CPF,
 * telefone e data de nascimento nunca são enviados ao modelo (a idade sim).
 *
 * Deploy:
 *   supabase secrets set ANTHROPIC_API_KEY=...
 *   supabase functions deploy triagem
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.128.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@^0.128.0/helpers/zod';
import { z } from 'npm:zod@^4';

const MODELO = 'claude-opus-5';
const LIMITE_RELATO = 2000;
const LIMITE_RESPOSTA = 500;
const MAX_RESPOSTAS = 5;
const MAX_PERGUNTAS = 3;

/**
 * O formato da resposta é imposto pelo schema, não pedido no prompt: o modelo
 * não consegue devolver outra coisa. Isso dispensa o que o site precisa fazer
 * na mão — limpar cercas ```json, tratar campo ausente, validar o nível.
 *
 * As chaves de `sintomas` são exatamente as colunas de `sintomas_atendimento`.
 * Limites de quantidade (máx. de perguntas) ficam no código: a API não aplica
 * `maxItems`, e o SDK recusaria a resposta inteira se o modelo passasse dele.
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
  perguntas: z
    .array(
      z.object({
        campo: z
          .enum(['alergias', 'medicamentos_em_uso', 'doencas_preexistentes', 'sintoma'])
          .describe('O que a pergunta ajuda a esclarecer'),
        pergunta: z.string().describe('Pergunta curta, direta, em linguagem simples'),
      }),
    )
    .describe(`Até ${MAX_PERGUNTAS} perguntas de acompanhamento; lista vazia se não houver`),
  atualizacoes_ficha: z
    .object({
      alergias: z.string().nullable(),
      medicamentos_em_uso: z.string().nullable(),
      doencas_preexistentes: z.string().nullable(),
    })
    .describe('Só o que o paciente afirmou explicitamente; null no que ele não disse'),
});

type Triagem = z.infer<typeof TriagemSchema>;

const INSTRUCOES = `Você é um assistente de triagem de sintomas de um aplicativo de saúde pública de Francisco Beltrão, no Paraná.

Analise o relato e classifique a urgência nesta escala:
1 - Não Urgente: autocuidado em casa
2 - Pouco Urgente: observação, orientação de farmácia
3 - Urgente: UBS ou posto de saúde
4 - Muito Urgente: UPA
5 - Emergência: hospital ou SAMU 192

Junto com o relato vem a ficha de saúde que o próprio paciente preencheu. Use-a para calibrar a orientação: idade, doenças preexistentes e medicamentos em uso podem tornar um mesmo sintoma mais preocupante, e alergias importam para os primeiros socorros.

Marque em "sintomas" apenas o que o relato menciona ou implica claramente — não presuma.

Perguntas de acompanhamento ("perguntas"), só na primeira análise:
- Se alergias, medicamentos em uso ou doenças preexistentes estiverem como "não informado" na ficha, pergunte sobre eles de forma curta.
- Pergunte sobre o sintoma (há quanto tempo, intensidade, o que piora) apenas se a resposta puder mudar o nível.
- No máximo ${MAX_PERGUNTAS} perguntas, as mais úteis primeiro.
- Nunca pergunte nome, CPF, telefone, endereço ou data de nascimento.
- Se já houver respostas de acompanhamento ou se o nível for 5, devolva a lista vazia: em emergência, nada deve atrasar a busca por atendimento.

Em "atualizacoes_ficha", preencha só o que o paciente afirmou explicitamente no relato ou nas respostas, em texto curto (ex.: "Dipirona", "Losartana 50 mg", "Nenhuma" se ele disse que não tem). Deixe null o que ele não disse — não deduza.

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

interface Resposta {
  pergunta: string;
  resposta: string;
}

/** Só as colunas clínicas: identificação (nome, CPF, telefone) nunca vai ao modelo. */
const COLUNAS_FICHA =
  'idade, data_nascimento, sexo, peso, altura, fuma, bebe, alergias, alergia_medicamento, ' +
  'medicamentos_em_uso, doencas_preexistentes, possui_deficiencia';

interface Ficha {
  idade: number | null;
  data_nascimento: string | null;
  sexo: string | null;
  peso: number | null;
  altura: number | null;
  fuma: boolean | null;
  bebe: boolean | null;
  alergias: string | null;
  alergia_medicamento: string | null;
  medicamentos_em_uso: string | null;
  doencas_preexistentes: string | null;
  possui_deficiencia: string | null;
}

function idadeDe(ficha: Ficha): number | null {
  if (ficha.data_nascimento) {
    const nasc = new Date(ficha.data_nascimento);
    if (!Number.isNaN(nasc.getTime())) {
      const hoje = new Date();
      let anos = hoje.getFullYear() - nasc.getFullYear();
      const fezAniversario =
        hoje.getMonth() > nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate());
      if (!fezAniversario) anos -= 1;
      return anos;
    }
  }
  return ficha.idade;
}

/** Resumo da ficha para o prompt. A data de nascimento vira idade aqui e não sai daqui. */
function resumoDaFicha(ficha: Ficha | null): string {
  if (!ficha) return 'Ficha de saúde: o paciente ainda não preencheu.';
  const v = (x: string | number | null | undefined) =>
    x === null || x === undefined || String(x).trim() === '' ? 'não informado' : String(x);
  const sn = (x: boolean | null) => (x === null ? 'não informado' : x ? 'sim' : 'não');
  return [
    'Ficha de saúde (preenchida pelo paciente):',
    `- Idade: ${v(idadeDe(ficha))}`,
    `- Sexo: ${v(ficha.sexo)}`,
    `- Peso (kg): ${v(ficha.peso)} · Altura (m): ${v(ficha.altura)}`,
    `- Fuma: ${sn(ficha.fuma)} · Bebe: ${sn(ficha.bebe)}`,
    `- Alergias: ${v(ficha.alergias)}`,
    `- Alergia a medicamentos: ${v(ficha.alergia_medicamento)}`,
    `- Medicamentos em uso: ${v(ficha.medicamentos_em_uso)}`,
    `- Doenças preexistentes: ${v(ficha.doencas_preexistentes)}`,
    `- Deficiência: ${v(ficha.possui_deficiencia)}`,
  ].join('\n');
}

/** O que fica no histórico (e vira a queixa do pré-prontuário): relato + respostas. */
function textoDoEpisodio(descricao: string, respostas: Resposta[]): string {
  if (respostas.length === 0) return descricao;
  const qa = respostas.map((r) => `${r.pergunta}\n${r.resposta}`).join('\n\n');
  return `${descricao}\n\n${qa}`;
}

function lerRespostas(bruto: unknown): Resposta[] | string {
  if (bruto === undefined || bruto === null) return [];
  if (!Array.isArray(bruto) || bruto.length > MAX_RESPOSTAS) return 'Respostas inválidas';
  const respostas: Resposta[] = [];
  for (const item of bruto) {
    const pergunta = typeof item?.pergunta === 'string' ? item.pergunta.trim() : '';
    const resposta = typeof item?.resposta === 'string' ? item.resposta.trim() : '';
    if (!pergunta || pergunta.length > LIMITE_RESPOSTA || resposta.length > LIMITE_RESPOSTA) {
      return `Cada resposta deve ter no máximo ${LIMITE_RESPOSTA} caracteres`;
    }
    if (resposta) respostas.push({ pergunta, resposta });
  }
  return respostas;
}

/**
 * Grava o episódio. Na segunda rodada atualiza o registro da primeira; se o
 * update não passar (registro de outro usuário, sem policy de UPDATE), grava um
 * novo para não perder a orientação.
 */
async function salvarHistorico(
  supabase: SupabaseClient,
  userId: string,
  texto: string,
  triagem: Triagem,
  historicoId: number | string | null,
): Promise<number | string | null> {
  // O histórico guarda só a triagem: perguntas e sugestões são da conversa, não do registro.
  const { perguntas: _p, atualizacoes_ficha: _a, ...registro } = triagem;
  const linha = { descricao_usuario: texto, resposta_ia: JSON.stringify(registro) };

  if (historicoId !== null) {
    const { data, error } = await supabase
      .from('historico_ia')
      .update(linha)
      .eq('id', historicoId)
      .eq('user_id', userId)
      .select('id');

    if (!error && data && data.length > 0) {
      const { data: s, error: erroS } = await supabase
        .from('sintomas_atendimento')
        .update(triagem.sintomas)
        .eq('historico_id', historicoId)
        .select('historico_id');
      if (erroS || !s || s.length === 0) {
        const { error: erroIns } = await supabase
          .from('sintomas_atendimento')
          .insert({ historico_id: historicoId, ...triagem.sintomas });
        if (erroIns) console.error('[triagem] sintomas não salvos:', erroIns.message);
      }
      return historicoId;
    }
    console.warn('[triagem] histórico não atualizado, gravando novo registro:', error?.message ?? '0 linhas');
  }

  const { data: historico, error: erroHistorico } = await supabase
    .from('historico_ia')
    .insert({ user_id: userId, ...linha })
    .select('id')
    .single();

  if (erroHistorico) {
    console.error('[triagem] histórico não salvo:', erroHistorico.message);
    return null;
  }

  const { error: erroSintomas } = await supabase
    .from('sintomas_atendimento')
    .insert({ historico_id: historico.id, ...triagem.sintomas });
  if (erroSintomas) console.error('[triagem] sintomas não salvos:', erroSintomas.message);

  return historico.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ erro: 'Método não permitido' }, 405);

  // 1. Só usuário autenticado. O cliente carrega o JWT de quem chamou, então as
  //    leituras e gravações abaixo continuam sujeitas às policies de RLS.
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
  let corpo: { descricao?: unknown; respostas?: unknown; historico_id?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: 'Corpo inválido' }, 400);
  }

  const { descricao } = corpo;
  if (typeof descricao !== 'string' || descricao.trim().length < 3) {
    return json({ erro: 'Descreva os sintomas com mais detalhes' }, 400);
  }
  if (descricao.length > LIMITE_RELATO) {
    return json({ erro: `O relato deve ter no máximo ${LIMITE_RELATO} caracteres` }, 400);
  }

  const respostas = lerRespostas(corpo.respostas);
  if (typeof respostas === 'string') return json({ erro: respostas }, 400);

  // O id vem do próprio retorno da primeira rodada; o update ainda filtra por user_id.
  const historicoId =
    typeof corpo.historico_id === 'number' || (typeof corpo.historico_id === 'string' && corpo.historico_id !== '')
      ? corpo.historico_id
      : null;
  const segundaRodada = respostas.length > 0;

  // 3. Ficha de saúde como contexto. Sem ficha (ou falha na leitura) a triagem segue.
  const { data: ficha, error: erroFicha } = await supabase
    .from('dados_saude')
    .select(COLUNAS_FICHA)
    .eq('user_id', user.id)
    .maybeSingle<Ficha>();
  if (erroFicha) console.error('[triagem] ficha não lida:', erroFicha.message);

  const partes = [resumoDaFicha(ficha ?? null), `Relato do paciente:\n\n${descricao}`];
  if (segundaRodada) {
    partes.push(
      'Respostas às perguntas de acompanhamento:\n\n' +
        respostas.map((r) => `Pergunta: ${r.pergunta}\nResposta: ${r.resposta}`).join('\n\n'),
    );
  }

  // 4. Claude, com a chave que só existe aqui
  const chave = Deno.env.get('ANTHROPIC_API_KEY');
  if (!chave) return json({ erro: 'Serviço de triagem não configurado' }, 500);

  const anthropic = new Anthropic({ apiKey: chave });

  let triagem: Triagem;
  try {
    const resposta = await anthropic.messages.parse({
      model: MODELO,
      // A saída é curta e de formato fixo; não há por que reservar mais.
      max_tokens: 2000,
      system: INSTRUCOES,
      // Classificação sobre um texto curto não exige raciocínio profundo.
      output_config: { effort: 'low', format: zodOutputFormat(TriagemSchema) },
      messages: [{ role: 'user', content: partes.join('\n\n') }],
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

  // As regras das perguntas valem aqui também, não só no prompt.
  triagem.perguntas = segundaRodada || triagem.nivel === 5 ? [] : triagem.perguntas.slice(0, MAX_PERGUNTAS);

  // 5. Histórico. Falhar aqui não invalida a orientação já produzida.
  const id = await salvarHistorico(
    supabase,
    user.id,
    textoDoEpisodio(descricao, respostas),
    triagem,
    segundaRodada ? historicoId : null,
  );

  return json({ ...triagem, historico_id: id });
});
