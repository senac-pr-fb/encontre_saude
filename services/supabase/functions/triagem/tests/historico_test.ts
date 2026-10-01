import { assert, assertEquals, assertMatch } from 'jsr:@std/assert@1';
import {
  agruparEpisodios,
  calcularRecorrencia,
  candidatosAContinuacao,
  MAX_CANDIDATOS,
  rotulosConhecidos,
  textoCandidatos,
  textoRecorrencia,
  type LinhaHistorico,
} from '../historico.ts';

const AGORA = Date.parse('2026-09-30T12:00:00Z');
const H = 60 * 60 * 1000;
const D = 24 * H;

const linha = (id: number, atras: number, over: Partial<LinhaHistorico> = {}): LinhaHistorico => ({
  id,
  created_at: new Date(AGORA - atras).toISOString(),
  descricao_usuario: `relato ${id}`,
  resposta_ia: JSON.stringify({ nivel: 2 }),
  episodio_id: null,
  queixa_rotulo: 'dor de cabeça',
  sintomas_atendimento: { dor_de_cabeca: true },
  ...over,
});

// Cenário validado no aparelho: enxaqueca → febre (mesmo episódio), joelho (outro),
// dor de cabeça antiga com continuação e um pré-prontuário manual.
const historico = [
  linha(10, 2 * H),
  linha(9, 26 * H, { queixa_rotulo: 'dor no joelho', sintomas_atendimento: {}, resposta_ia: JSON.stringify({ nivel: 1 }) }),
  linha(7, 12 * D),
  linha(8, 11.5 * D, { episodio_id: 7, resposta_ia: JSON.stringify({ nivel: 3 }), sintomas_atendimento: [{ dor_de_cabeca: true, nausea_vomito: true }] }),
  linha(3, 120 * D),
  linha(2, 150 * D, { queixa_rotulo: null, resposta_ia: 'Pré-Prontuário gerado manualmente pelo usuário.', sintomas_atendimento: { tontura: true } }),
];

Deno.test('agrupa continuações no mesmo episódio, mais recente primeiro', () => {
  const eps = agruparEpisodios(historico);
  assertEquals(eps.map((e) => e.chave), ['10', '9', '7', '3', '2']);
  const comContinuacao = eps.find((e) => e.chave === '7')!;
  assertEquals(comContinuacao.linhas.map((l) => l.id), [7, 8]);
  assertEquals(comContinuacao.nivelMax, 3);
});

Deno.test('registro manual (sem JSON de triagem) entra sem nível e sem quebrar', () => {
  const manual = agruparEpisodios(historico).find((e) => e.chave === '2')!;
  assertEquals(manual.nivelMax, null);
  assert(manual.rotulos.has('tontura'));
});

Deno.test('candidatos: só episódios das últimas 72 h, rotulados E1, E2…', () => {
  const candidatos = candidatosAContinuacao(agruparEpisodios(historico), AGORA);
  assertEquals([...candidatos.keys()], ['E1', 'E2']);
  assertEquals(candidatos.get('E1')!.chave, '10');
  assertEquals(candidatos.get('E2')!.chave, '9');
});

Deno.test(`candidatos: no máximo ${MAX_CANDIDATOS}`, () => {
  const muitos = Array.from({ length: 8 }, (_, i) => linha(100 + i, (i + 1) * H));
  assertEquals(candidatosAContinuacao(agruparEpisodios(muitos), AGORA).size, MAX_CANDIDATOS);
});

Deno.test('recorrência conta episódios, não relatos: a continuação não infla', () => {
  const rec = calcularRecorrencia(agruparEpisodios(historico), AGORA);
  const cabeca = rec.find((i) => i.rotulo === 'dor de cabeça')!;
  // 10, 7(+8) e 3 → 3 episódios, não 4 relatos.
  assertEquals(cabeca.episodios, 3);
  assertEquals(cabeca.ultimos_30_dias, 2);
  assertEquals(cabeca.nivel_max, 3);
});

Deno.test('ao modelo vai só trecho dos relatos recentes; dos antigos, só contagens', () => {
  const eps = agruparEpisodios(historico);
  const candidatos = textoCandidatos(candidatosAContinuacao(eps, AGORA), AGORA);
  const recorrencia = textoRecorrencia(calcularRecorrencia(eps, AGORA), AGORA);

  assertMatch(candidatos, /\[E1\] há 2 h · dor de cabeça/);
  // Relatos de dias/meses atrás não aparecem como texto.
  for (const antigo of ['relato 7', 'relato 8', 'relato 3', 'relato 2']) {
    assert(!candidatos.includes(antigo) && !recorrencia.includes(antigo), antigo);
  }
  assertMatch(recorrencia, /dor de cabeça: 3 episódios · 2 nos últimos 30 dias/);
});

Deno.test('relato longo é truncado no resumo enviado', () => {
  const longo = [linha(1, H, { descricao_usuario: 'x'.repeat(500) })];
  const texto = textoCandidatos(candidatosAContinuacao(agruparEpisodios(longo), AGORA), AGORA);
  assert(texto.includes('…') && !texto.includes('x'.repeat(200)));
});

Deno.test('rótulos conhecidos vêm normalizados, para o modelo reaproveitar', () => {
  const eps = agruparEpisodios([linha(1, H, { queixa_rotulo: '  Dor  de Cabeça ' })]);
  assertEquals(rotulosConhecidos(eps), ['dor de cabeça']);
});
