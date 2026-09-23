import { z } from 'zod';
import { SEXOS } from '@domain/entities/PerfilSaude';
import { SINTOMAS, type ColunaSintoma } from '@domain/entities/PreProntuario';
import { dataParaISO, ehDataNascimentoValida } from '@core/utils/formato';

/**
 * Formulário de 4 etapas. Como no perfil, a entrada é texto e a saída já é o
 * formato da entidade. As regras replicam `validarStep()` do site, com dois
 * acréscimos: data de nascimento validada de verdade (o site só checa se está
 * preenchida) e limites nos sinais vitais, iguais aos do perfil.
 */

const colunas = SINTOMAS.map((s) => s.coluna) as [ColunaSintoma, ...ColunaSintoma[]];

const textoOpcional = z
  .string()
  .trim()
  .transform((s) => (s === '' ? null : s));

const numeroOpcional = (min: number, max: number, mensagem: string) =>
  z
    .string()
    .trim()
    .transform((s) => (s === '' ? null : Number(s.replace(',', '.'))))
    .refine((n) => n === null || (Number.isFinite(n) && n >= min && n <= max), mensagem);

export const etapaDados = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo (mínimo 3 caracteres)'),
  dataNascimento: z
    .string()
    .trim()
    .transform((s) => dataParaISO(s))
    .refine(ehDataNascimentoValida, 'Informe uma data válida, no formato dd/mm/aaaa'),
  cpf: z
    .string()
    .transform((s) => s.replace(/\D/g, ''))
    .refine((v) => v.length === 11, 'O CPF precisa ter 11 dígitos'),
  sexo: z.enum(SEXOS, { error: 'Selecione o sexo biológico' }),
  telefone: z
    .string()
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Telefone inválido. Inclua o DDD'),
});

export const etapaSintomas = z.object({
  queixaPrincipal: z.string().trim().min(10, 'Descreva a queixa com pelo menos 10 caracteres'),
  tempoSintoma: textoOpcional,
  sintomas: z.array(z.enum(colunas)),
});

export const etapaClinica = z.object({
  alergias: textoOpcional,
  medicamentosEmUso: textoOpcional,
  doencasPreexistentes: textoOpcional,
  historicoFamiliar: textoOpcional,
  pressaoArterial: z
    .string()
    .trim()
    .transform((s) => (s === '' ? null : s))
    .refine((v) => v === null || /^\d{2,3}\/\d{2,3}$/.test(v), 'Use o formato 120/80'),
  frequenciaCardiaca: numeroOpcional(20, 250, 'Informe entre 20 e 250 bpm'),
  temperatura: numeroOpcional(30, 45, 'Informe entre 30 e 45 °C'),
  saturacaoOxigenio: numeroOpcional(0, 100, 'Informe entre 0 e 100%'),
  peso: numeroOpcional(0, 300, 'Informe um peso entre 0 e 300 kg'),
  altura: numeroOpcional(0.3, 3, 'Informe uma altura entre 0,30 e 3,00 m'),
  observacoes: textoOpcional,
});

export const prontuarioSchema = etapaDados.extend(etapaSintomas.shape).extend(etapaClinica.shape);

export type ProntuarioFormInput = z.input<typeof prontuarioSchema>;
export type ProntuarioFormOutput = z.output<typeof prontuarioSchema>;

/** Campos validados em cada etapa — o avanço só acontece se os dela passarem. */
export const CAMPOS_POR_ETAPA: Record<number, (keyof ProntuarioFormInput)[]> = {
  1: ['nome', 'dataNascimento', 'cpf', 'sexo', 'telefone'],
  2: ['queixaPrincipal', 'tempoSintoma', 'sintomas'],
  3: [
    'alergias',
    'medicamentosEmUso',
    'doencasPreexistentes',
    'historicoFamiliar',
    'pressaoArterial',
    'frequenciaCardiaca',
    'temperatura',
    'saturacaoOxigenio',
    'peso',
    'altura',
    'observacoes',
  ],
  4: [],
};

export const TITULOS_ETAPAS = ['Dados pessoais', 'Sintomas', 'Histórico clínico', 'Revisão'] as const;
export const ICONES_ETAPAS = ['user', 'stethoscope', 'notes-medical', 'file-circle-check'] as const;

export const FORMULARIO_VAZIO: ProntuarioFormInput = {
  nome: '',
  dataNascimento: '',
  cpf: '',
  sexo: 'Masculino',
  telefone: '',
  queixaPrincipal: '',
  tempoSintoma: '',
  sintomas: [],
  alergias: '',
  medicamentosEmUso: '',
  doencasPreexistentes: '',
  historicoFamiliar: '',
  pressaoArterial: '',
  frequenciaCardiaca: '',
  temperatura: '',
  saturacaoOxigenio: '',
  peso: '',
  altura: '',
  observacoes: '',
};
