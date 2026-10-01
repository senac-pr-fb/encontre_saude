import { assert, assertEquals } from 'jsr:@std/assert@1';
import { analisarComModelo, type Dependencias } from '../modelo.ts';

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
