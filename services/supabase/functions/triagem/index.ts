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
 * Histórico como contexto (historico.ts): relatos das últimas 72 h entram como
 * candidatos a continuação ("dor de cabeça há 2 h" + "agora febre" = mesmo
 * episódio) e os últimos 6 meses viram contagens de recorrência. A ligação é
 * sugerida pela IA e validada aqui; o app permite desfazê-la.
 *
 * Privacidade: da ficha, só os dados clínicos entram no prompt. Nome, CPF,
 * telefone e data de nascimento nunca são enviados ao modelo (a idade sim).
 *
 * O provedor de IA (Gemini) fica isolado em modelo.ts; o schema da resposta,
 * em schema.ts.
 *
 * Deploy:
 *   supabase secrets set GEMINI_API_KEY=...
 *   supabase functions deploy triagem
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  agruparEpisodios,
  calcularRecorrencia,
  candidatosAContinuacao,
  JANELA_RECORRENCIA_DIAS,
  normalizarRotulo,
  rotulosConhecidos,
  textoCandidatos,
  textoRecorrencia,
  type ItemRecorrencia,
  type LinhaHistorico,
} from './historico.ts';
import { MAX_PERGUNTAS, type Triagem } from './schema.ts';
import { analisarComModelo } from './modelo.ts';

const LIMITE_RELATO = 2000;
const LIMITE_RESPOSTA = 500;
const MAX_RESPOSTAS = 5;

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

Relatos recentes ("relacao" e "episodio_relacionado"):
- Marque "continuacao" só se o relato atual for evolução do mesmo problema de um relato recente listado: piora, novo sintoma plausivelmente ligado (ex.: dor de cabeça e depois febre), ou complemento do que já foi contado. Informe o código (E1, E2…).
- Marque "novo" se for outro problema: outra parte do corpo sem ligação, outra causa (ex.: dor no joelho após exercício depois de uma dor de cabeça). Na dúvida, "novo".
- Em continuação, classifique o nível pelo quadro completo, considerando também os relatos anteriores do episódio.

Recorrência: se a queixa atual já apareceu em outros episódios, diga isso de forma simples na recomendação e sugira avaliação na UBS mesmo que este episódio passe. Mudança de padrão — mais frequente, mais forte ou diferente das anteriores — merece mais atenção. Não dê nome de doença.

Em "queixa_rotulo", se a queixa for a mesma de um rótulo já usado por este paciente, repita exatamente esse rótulo.

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

/** Colunas novas do histórico; ausentes enquanto a migration da fase 4.1 não roda. */
interface ExtrasHistorico {
  episodio_id: number | string | null;
  queixa_rotulo: string;
}

/**
 * Últimos 6 meses do histórico do usuário. Sem as colunas novas (migration não
 * aplicada), lê sem elas e a triagem segue como antes, sem episódios.
 */
async function lerHistorico(
  supabase: SupabaseClient,
  userId: string,
  agora: number,
): Promise<{ linhas: LinhaHistorico[]; colunasNovas: boolean }> {
  const desde = new Date(agora - JANELA_RECORRENCIA_DIAS * 24 * 60 * 60 * 1000).toISOString();
  const base = 'id, created_at, descricao_usuario, resposta_ia, sintomas_atendimento(*)';
  const consultar = (colunas: string) =>
    supabase
      .from('historico_ia')
      .select(colunas)
      .eq('user_id', userId)
      .gte('created_at', desde)
      .order('created_at', { ascending: false })
      .limit(300);

  const completo = await consultar(`${base}, episodio_id, queixa_rotulo`);
  if (!completo.error) return { linhas: (completo.data ?? []) as unknown as LinhaHistorico[], colunasNovas: true };

  console.warn('[triagem] histórico sem colunas de episódio:', completo.error.message);
  const simples = await consultar(base);
  if (simples.error) console.error('[triagem] histórico não lido:', simples.error.message);
  return { linhas: (simples.data ?? []) as unknown as LinhaHistorico[], colunasNovas: false };
}

/**
 * Grava o relato. Na segunda rodada atualiza o registro da primeira (sem mexer
 * no episódio já decidido); se o update não passar (sem policy de UPDATE),
 * grava um novo para não perder a orientação.
 */
async function salvarHistorico(
  supabase: SupabaseClient,
  userId: string,
  texto: string,
  triagem: Triagem,
  recorrencia: ItemRecorrencia[],
  extras: ExtrasHistorico | null,
  historicoId: number | string | null,
): Promise<number | string | null> {
  // O registro guarda a triagem e a recorrência daquele momento (vai para o PDF);
  // perguntas, sugestões e a decisão de episódio são da conversa.
  const {
    perguntas: _p,
    atualizacoes_ficha: _a,
    relacao: _r,
    episodio_relacionado: _e,
    queixa_rotulo: _q,
    ...registro
  } = triagem;
  const linha = { descricao_usuario: texto, resposta_ia: JSON.stringify({ ...registro, recorrencia }) };

  if (historicoId !== null) {
    const { data, error } = await supabase
      .from('historico_ia')
      .update(extras ? { ...linha, queixa_rotulo: extras.queixa_rotulo } : linha)
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
    .insert({ user_id: userId, ...linha, ...(extras ?? {}) })
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

  // 4. Histórico como contexto: episódios recentes e recorrência. Na segunda
  //    rodada o próprio registro sai da conta, senão contaria duas vezes.
  const agora = Date.now();
  const { linhas, colunasNovas } = await lerHistorico(supabase, user.id, agora);
  const anteriores = segundaRodada ? linhas.filter((l) => String(l.id) !== String(historicoId)) : linhas;
  const episodios = agruparEpisodios(anteriores);
  // Na segunda rodada o episódio já foi decidido na primeira.
  const candidatos = segundaRodada || !colunasNovas ? new Map() : candidatosAContinuacao(episodios, agora);
  const recorrencia = calcularRecorrencia(episodios, agora);

  const partes = [
    resumoDaFicha(ficha ?? null),
    textoCandidatos(candidatos, agora),
    textoRecorrencia(recorrencia, agora),
    `Rótulos já usados por este paciente: ${rotulosConhecidos(episodios).join(', ') || 'nenhum'}.`,
    `Relato do paciente:\n\n${descricao}`,
  ];
  if (segundaRodada) {
    partes.push(
      'Respostas às perguntas de acompanhamento:\n\n' +
        respostas.map((r) => `Pergunta: ${r.pergunta}\nResposta: ${r.resposta}`).join('\n\n'),
    );
  }

  // 5. Modelo de IA (modelo.ts), com a chave que só existe aqui
  const analise = await analisarComModelo(INSTRUCOES, partes.join('\n\n'));
  if (!analise.ok) return json({ erro: analise.erro }, analise.status);
  const triagem: Triagem = analise.triagem;

  // As regras das perguntas valem aqui também, não só no prompt.
  triagem.perguntas = segundaRodada || triagem.nivel === 5 ? [] : triagem.perguntas.slice(0, MAX_PERGUNTAS);

  // A IA sugere a ligação; só vale se o código for um dos candidatos enviados.
  const relacionado =
    triagem.relacao === 'continuacao' && triagem.episodio_relacionado
      ? candidatos.get(triagem.episodio_relacionado.trim().toUpperCase()) ?? null
      : null;
  const rotulo = normalizarRotulo(triagem.queixa_rotulo) || 'queixa sem rótulo';

  // Segunda rodada: o episódio é o do registro da primeira.
  const registroAtual = segundaRodada ? linhas.find((l) => String(l.id) === String(historicoId)) : undefined;
  const episodioId = segundaRodada ? registroAtual?.episodio_id ?? null : relacionado?.chave ?? null;
  const episodioAnterior = segundaRodada
    ? episodioId !== null
      ? episodios.find((e) => e.chave === String(episodioId)) ?? null
      : null
    : relacionado;

  // 6. Histórico. Falhar aqui não invalida a orientação já produzida.
  const id = await salvarHistorico(
    supabase,
    user.id,
    textoDoEpisodio(descricao, respostas),
    triagem,
    recorrencia,
    colunasNovas ? { episodio_id: episodioId, queixa_rotulo: rotulo } : null,
    segundaRodada ? historicoId : null,
  );

  const { episodio_relacionado: _e, ...saida } = triagem;
  return json({
    ...saida,
    queixa_rotulo: rotulo,
    relacao: episodioAnterior ? 'continuacao' : 'novo',
    // O app mostra "continuação de … · Não é isso" com isto.
    episodio: episodioAnterior
      ? {
          id: episodioAnterior.chave,
          desde: new Date(episodioAnterior.inicio).toISOString(),
          rotulo: episodioAnterior.linhas[0]?.queixa_rotulo ?? [...episodioAnterior.rotulos][0] ?? null,
        }
      : null,
    recorrencia,
    historico_id: id,
  });
});
