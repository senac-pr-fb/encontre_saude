import { assert, assertEquals } from 'jsr:@std/assert@1';
import { analisarComModelo, provedorEscolhido, type Dependencias } from '../modelo.ts';

const respostaValida = {
  nivel: 3,
  resumo: 'r',
  recomendacao: 'rec',
  primeiros_socorros: '',
  unidade_recomendada: 'UBS',
  sintomas: {
    febre: true, dor_de_cabeca: false, tosse: false, falta_de_ar: false, dor_no_peito: false, nausea_vomito: false,
    diarreia: false, dor_abdominal: false, dor_nas_costas: false, tontura: false, fraqueza: false, coriza: false,
  },
  perguntas: [],
  atualizacoes_ficha: { alergias: null, medicamentos_em_uso: null, doencas_preexistentes: null },
  relacao: 'novo',
  episodio_relacionado: null,
  queixa_rotulo: 'febre',
};

/** Gemini falso: devolve o que o teste mandar e guarda o que recebeu. */
function falso(
  resposta: { status: string; output_text?: string } | Error,
  env: Record<string, string> = { GEMINI_API_KEY: 'chave-teste' },
) {
  const chamadas: { chave: string; params: Record<string, unknown> }[] = [];
  const deps: Dependencias = {
    env: (nome) => env[nome],
    criarInteracao: (chave, params) => {
      chamadas.push({ chave, params: params as unknown as Record<string, unknown> });
      return resposta instanceof Error ? Promise.reject(resposta) : Promise.resolve(resposta);
    },
    chamarClaude: () => Promise.reject(new Error('o Gemini é o provedor deste teste')),
  };
  return { deps, chamadas };
}

const erroHttp = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });

Deno.test('sucesso: devolve a triagem validada', async () => {
  const { deps } = falso({ status: 'completed', output_text: JSON.stringify(respostaValida) });
  const r = await analisarComModelo('instruções', 'relato', deps);
  assert(r.ok);
  assertEquals(r.triagem.nivel, 3);
});

Deno.test('pedido: instruções separadas, saída JSON com schema, sem guardar no provedor', async () => {
  const { deps, chamadas } = falso({ status: 'completed', output_text: JSON.stringify(respostaValida) });
  await analisarComModelo('instruções', 'relato', deps);

  const { chave, params } = chamadas[0];
  assertEquals(chave, 'chave-teste');
  assertEquals(params.system_instruction, 'instruções');
  assertEquals(params.input, 'relato');
  assertEquals(params.store, false);
  assertEquals(params.model, 'gemini-3.8-flash');
  const formato = params.response_format as { mime_type: string; schema: Record<string, unknown> };
  assertEquals(formato.mime_type, 'application/json');
  // Sem os recursos fora da documentação do Gemini.
  const schema = JSON.stringify(formato.schema);
  assert(!schema.includes('"$schema"') && !schema.includes('"minimum"') && !schema.includes('"maximum"'));
});

Deno.test('GEMINI_MODEL troca o modelo sem mudar código', async () => {
  const { deps, chamadas } = falso(
    { status: 'completed', output_text: JSON.stringify(respostaValida) },
    { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'outro-modelo' },
  );
  await analisarComModelo('i', 'r', deps);
  assertEquals(chamadas[0].params.model, 'outro-modelo');
});

Deno.test('sem chave configurada: 500, sem chamar o provedor', async () => {
  const { deps, chamadas } = falso({ status: 'completed' }, {});
  assertEquals(await analisarComModelo('i', 'r', deps), { ok: false, status: 500, erro: 'Serviço de triagem não configurado' });
  assertEquals(chamadas.length, 0);
});

Deno.test('interação não concluída (ex.: bloqueio de segurança): 422 com orientação', async () => {
  const { deps } = falso({ status: 'failed' });
  const r = await analisarComModelo('i', 'r', deps);
  assert(!r.ok);
  assertEquals(r.status, 422);
  assert(r.erro.includes('Procure atendimento'));
});

Deno.test('resposta que não é JSON ou está fora do schema: 502', async () => {
  for (const output_text of ['não é json', JSON.stringify({ ...respostaValida, nivel: 7 }), JSON.stringify({ nivel: 2 })]) {
    const { deps } = falso({ status: 'completed', output_text });
    const r = await analisarComModelo('i', 'r', deps);
    assert(!r.ok);
    assertEquals(r.status, 502);
  }
});

Deno.test('erros do provedor viram as mensagens de sempre, sem detalhe interno', async () => {
  const casos: [number, number, string][] = [
    [401, 500, 'Serviço de triagem não configurado'],
    [403, 500, 'Serviço de triagem não configurado'],
    [429, 429, 'Muitas consultas agora. Tente de novo em instantes'],
    [503, 502, 'Não foi possível analisar os sintomas agora'],
  ];
  for (const [http, status, erro] of casos) {
    const { deps } = falso(erroHttp(http));
    assertEquals(await analisarComModelo('i', 'r', deps), { ok: false, status, erro });
  }
});

/** Claude falso: mesmo papel do Gemini falso acima. */
function claudeFalso(
  resposta: { stop_reason: string | null; parsed_output?: unknown; stop_details?: unknown } | Error,
  env: Record<string, string> = { IA_PROVEDOR: 'anthropic', ANTHROPIC_API_KEY: 'sk-teste' },
) {
  const chamadas: { chave: string; params: Record<string, unknown> }[] = [];
  const deps: Dependencias = {
    env: (nome) => env[nome],
    criarInteracao: () => Promise.reject(new Error('o Claude é o provedor deste teste')),
    chamarClaude: (chave, params) => {
      chamadas.push({ chave, params: params as unknown as Record<string, unknown> });
      return resposta instanceof Error ? Promise.reject(resposta) : Promise.resolve(resposta);
    },
  };
  return { deps, chamadas };
}

Deno.test('provedor: IA_PROVEDOR escolhe; vazio ou desconhecido cai no Gemini', () => {
  const env = (valor?: string) => (nome: string) => (nome === 'IA_PROVEDOR' ? valor : undefined);
  assertEquals(provedorEscolhido(env('anthropic')), 'anthropic');
  assertEquals(provedorEscolhido(env(' Anthropic ')), 'anthropic');
  assertEquals(provedorEscolhido(env('gemini')), 'gemini');
  assertEquals(provedorEscolhido(env(undefined)), 'gemini');
  assertEquals(provedorEscolhido(env('openai')), 'gemini');
});

Deno.test('Claude: sucesso devolve a triagem validada, com o mesmo schema', async () => {
  const { deps } = claudeFalso({ stop_reason: 'end_turn', parsed_output: respostaValida });
  const r = await analisarComModelo('instruções', 'relato', deps);
  assert(r.ok);
  assertEquals(r.triagem.queixa_rotulo, 'febre');
});

Deno.test('Claude: pedido com esforço baixo, fallback em recusa e modelo configurável', async () => {
  const { deps, chamadas } = claudeFalso({ stop_reason: 'end_turn', parsed_output: respostaValida });
  await analisarComModelo('instruções', 'relato', deps);

  const { chave, params } = chamadas[0];
  assertEquals(chave, 'sk-teste');
  assertEquals(params.model, 'claude-opus-5-5');
  assertEquals(params.system, 'instruções');
  assertEquals((params.output_config as { effort: string }).effort, 'low');
  assertEquals(params.fallbacks, 'default');
  assertEquals(params.betas, ['server-side-fallback-2026-07-01']);

  const outro = claudeFalso(
    { stop_reason: 'end_turn', parsed_output: respostaValida },
    { IA_PROVEDOR: 'anthropic', ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'claude-sonnet-5-5' },
  );
  await analisarComModelo('i', 'r', outro.deps);
  assertEquals(outro.chamadas[0].params.model, 'claude-sonnet-5-5');
});

Deno.test('Claude: recusa (mesmo após o fallback) vira 422 com orientação', async () => {
  const { deps } = claudeFalso({ stop_reason: 'refusal', stop_details: { category: 'bio' } });
  const r = await analisarComModelo('i', 'r', deps);
  assert(!r.ok);
  assertEquals(r.status, 422);
});

Deno.test('Claude: sem chave, 500 sem chamar; chave inválida e limite com as mensagens de sempre', async () => {
  const semChave = claudeFalso({ stop_reason: 'end_turn' }, { IA_PROVEDOR: 'anthropic' });
  assertEquals((await analisarComModelo('i', 'r', semChave.deps)).ok, false);
  assertEquals(semChave.chamadas.length, 0);

  const invalida = claudeFalso(erroHttp(401));
  assertEquals(await analisarComModelo('i', 'r', invalida.deps), { ok: false, status: 500, erro: 'Serviço de triagem não configurado' });
  const limite = claudeFalso(erroHttp(429));
  assertEquals((await analisarComModelo('i', 'r', limite.deps)) as unknown, {
    ok: false,
    status: 429,
    erro: 'Muitas consultas agora. Tente de novo em instantes',
  });
});

Deno.test('chave com espaço ou vazia (secret gravado errado) conta como ausente', async () => {
  const { deps, chamadas } = falso({ status: 'completed' }, { GEMINI_API_KEY: '   ' });
  assertEquals((await analisarComModelo('i', 'r', deps)).ok, false);
  assertEquals(chamadas.length, 0);
});
