import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  COLUNAS_FICHA,
  episodioIndicado,
  idadeDe,
  lerRespostas,
  limitarPerguntas,
  LIMITE_RESPOSTA,
  MAX_RESPOSTAS,
  resumoDaFicha,
  textoDoEpisodio,
  type Ficha,
} from '../regras.ts';
import { agruparEpisodios, candidatosAContinuacao } from '../historico.ts';
import type { Triagem } from '../schema.ts';

const ficha: Ficha = {
  idade: null,
  data_nascimento: '1990-05-10',
  sexo: 'Feminino',
  peso: 62,
  altura: 1.6,
  fuma: false,
  bebe: null,
  alergias: 'Dipirona',
  alergia_medicamento: null,
  medicamentos_em_uso: null,
  doencas_preexistentes: 'Hipertensão',
  possui_deficiencia: null,
};

const triagem: Triagem = {
  nivel: 3,
  resumo: 'r',
  recomendacao: 'rec',
  primeiros_socorros: '',
  unidade_recomendada: 'UBS',
  sintomas: {
    febre: true, dor_de_cabeca: false, tosse: false, falta_de_ar: false, dor_no_peito: false, nausea_vomito: false,
    diarreia: false, dor_abdominal: false, dor_nas_costas: false, tontura: false, fraqueza: false, coriza: false,
  },
  perguntas: [
    { campo: 'alergias', pergunta: 'a?' },
    { campo: 'sintoma', pergunta: 'b?' },
    { campo: 'sintoma', pergunta: 'c?' },
    { campo: 'sintoma', pergunta: 'd?' },
  ],
  atualizacoes_ficha: { alergias: null, medicamentos_em_uso: null, doencas_preexistentes: null },
  relacao: 'novo',
  episodio_relacionado: null,
  queixa_rotulo: 'febre',
};

Deno.test('privacidade: a ficha lida para o modelo não tem colunas de identificação', () => {
  const colunas = COLUNAS_FICHA.split(',').map((c) => c.trim());
  for (const proibida of ['nome', 'CPF', 'cpf', 'telefone', 'contato_medico_particular', 'user_id']) {
    assert(!colunas.includes(proibida), proibida);
  }
});

Deno.test('privacidade: a data de nascimento vira idade e não aparece no resumo', () => {
  const resumo = resumoDaFicha(ficha, new Date('2026-09-30T12:00:00Z'));
  assert(resumo.includes('- Idade: 36'));
  assert(!resumo.includes('1990'));
  assert(resumo.includes('- Alergias: Dipirona'));
  assert(resumo.includes('- Medicamentos em uso: não informado'));
});

Deno.test('idade considera se já fez aniversário no ano', () => {
  assertEquals(idadeDe(ficha, new Date('2026-05-09T12:00:00Z')), 35);
  assertEquals(idadeDe(ficha, new Date('2026-05-10T12:00:00Z')), 36);
  assertEquals(idadeDe({ ...ficha, data_nascimento: null, idade: 40 }), 40);
});

Deno.test('sem ficha, o modelo é avisado', () => {
  assertEquals(resumoDaFicha(null), 'Ficha de saúde: o paciente ainda não preencheu.');
});

Deno.test('respostas: descarta as em branco e recusa entrada inválida', () => {
  assertEquals(lerRespostas(undefined), []);
  assertEquals(lerRespostas([{ pergunta: ' P ', resposta: ' R ' }, { pergunta: 'Q', resposta: '  ' }]), [
    { pergunta: 'P', resposta: 'R' },
  ]);
  assertEquals(typeof lerRespostas('não é lista'), 'string');
  assertEquals(typeof lerRespostas(Array.from({ length: MAX_RESPOSTAS + 1 }, () => ({ pergunta: 'p', resposta: 'r' }))), 'string');
  assertEquals(typeof lerRespostas([{ pergunta: 'p', resposta: 'x'.repeat(LIMITE_RESPOSTA + 1) }]), 'string');
  assertEquals(typeof lerRespostas([{ resposta: 'sem pergunta' }]), 'string');
});

Deno.test('texto do episódio: relato seguido das perguntas e respostas', () => {
  assertEquals(textoDoEpisodio('Febre', []), 'Febre');
  assertEquals(textoDoEpisodio('Febre', [{ pergunta: 'Alergias?', resposta: 'Dipirona' }]), 'Febre\n\nAlergias?\nDipirona');
});

Deno.test('perguntas: no máximo 3; nenhuma na segunda rodada nem em emergência', () => {
  assertEquals(limitarPerguntas(triagem, false).length, 3);
  assertEquals(limitarPerguntas(triagem, true), []);
  assertEquals(limitarPerguntas({ ...triagem, nivel: 5 }, false), []);
});

Deno.test('episódio indicado pela IA só vale se for um dos candidatos enviados', () => {
  const agora = Date.parse('2026-09-30T12:00:00Z');
  const candidatos = candidatosAContinuacao(
    agruparEpisodios([
      { id: 10, created_at: new Date(agora - 3_600_000).toISOString(), descricao_usuario: 'dor de cabeça', resposta_ia: null },
    ]),
    agora,
  );

  assertEquals(episodioIndicado({ ...triagem, relacao: 'continuacao', episodio_relacionado: ' e1 ' }, candidatos)?.chave, '10');
  // Código inventado, ou id de banco no lugar do código: vira episódio novo.
  assertEquals(episodioIndicado({ ...triagem, relacao: 'continuacao', episodio_relacionado: 'E9' }, candidatos), null);
  assertEquals(episodioIndicado({ ...triagem, relacao: 'continuacao', episodio_relacionado: '10' }, candidatos), null);
  // "novo" com código sobrando não liga nada.
  assertEquals(episodioIndicado({ ...triagem, relacao: 'novo', episodio_relacionado: 'E1' }, candidatos), null);
});
