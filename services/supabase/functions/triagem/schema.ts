import { z } from 'npm:zod@^4';

export const MAX_PERGUNTAS = 3;

/**
 * Formato da resposta da triagem. É a fonte da verdade nos dois sentidos: vira
 * o JSON Schema que o modelo é obrigado a seguir e valida o que ele devolveu.
 * Isso dispensa o que o site faz na mão — limpar cercas ```json, tratar campo
 * ausente, conferir o nível.
 *
 * As chaves de `sintomas` são exatamente as colunas de `sintomas_atendimento`.
 * Limites de quantidade (máx. de perguntas) ficam no código, não no schema: se o
 * modelo passasse do limite, a resposta inteira seria descartada.
 */
export const TriagemSchema = z.object({
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
  relacao: z
    .enum(['novo', 'continuacao'])
    .describe('continuacao se o relato é evolução de um dos relatos recentes listados; novo caso contrário'),
  // Código (E1, E2…) e não enum: o schema fica fixo, igual em toda chamada.
  episodio_relacionado: z
    .string()
    .nullable()
    .describe('Código do relato recente (ex.: E1) quando relacao é continuacao; null quando é novo'),
  queixa_rotulo: z
    .string()
    .describe('Rótulo da queixa principal em 2 a 4 palavras, minúsculas, termo leigo (ex.: "dor de cabeça", "dor no joelho")'),
});

export type Triagem = z.infer<typeof TriagemSchema>;
