import { z } from 'zod';
import { SEXOS, type PerfilSaude } from '@domain/entities/PerfilSaude';
import { dataParaBR, dataParaISO, ehDataNascimentoValida } from '@core/utils/formato';

/**
 * Schema único do formulário de perfil: valida e converte.
 * A entrada é sempre texto (é o que um TextInput entrega); a saída já está no
 * formato da entidade (number | null, string | null). Serve tanto ao SavePerfil
 * quanto ao react-hook-form, que assim compartilham as mesmas mensagens.
 *
 * Os limites replicam os do site (frontend/pages/perfil_pages/perfil.html).
 */

const textoOpcional = z
  .string()
  .trim()
  .transform((s) => (s === '' ? null : s));

const numeroOpcional = (min: number, max: number, mensagem: string) =>
  z
    .string()
    .trim()
    // Aceita vírgula decimal (teclado pt-BR)
    .transform((s) => (s === '' ? null : Number(s.replace(',', '.'))))
    .refine((n) => n === null || (Number.isFinite(n) && n >= min && n <= max), mensagem);

const cpfOpcional = z
  .string()
  .transform((s) => {
    const digitos = s.replace(/\D/g, '');
    return digitos === '' ? null : digitos;
  })
  .refine((v) => v === null || v.length === 11, 'O CPF precisa ter 11 dígitos');

/** Entra como dd/mm/aaaa (padrão pt-BR); sai como AAAA-MM-DD, formato da coluna date. */
const dataOpcional = z
  .string()
  .trim()
  .transform((s) => (s === '' ? null : dataParaISO(s)))
  .refine((v) => v === null || ehDataNascimentoValida(v), 'Informe uma data válida, no formato dd/mm/aaaa');

const emailOpcional = z
  .string()
  .trim()
  .transform((s) => (s === '' ? null : s))
  .refine((v) => v === null || z.email().safeParse(v).success, 'Informe um e-mail válido');

const pressaoOpcional = z
  .string()
  .trim()
  .transform((s) => (s === '' ? null : s))
  .refine((v) => v === null || /^\d{2,3}\/\d{2,3}$/.test(v), 'Use o formato 120/80');

export const perfilSchema = z.object({
  idade: numeroOpcional(0, 130, 'Informe uma idade entre 0 e 130'),
  peso: numeroOpcional(0, 300, 'Informe um peso entre 0 e 300 kg'),
  altura: numeroOpcional(0.3, 3, 'Informe uma altura entre 0,30 e 3,00 m'),
  sexo: z.enum(SEXOS).nullable(),
  cpf: cpfOpcional,
  dataNascimento: dataOpcional,
  telefone: textoOpcional,
  fuma: z.boolean(),
  bebe: z.boolean(),
  alergias: textoOpcional,
  alergiaMedicamento: textoOpcional,
  medicamentosEmUso: textoOpcional,
  doencasPreexistentes: textoOpcional,
  historicoFamiliar: textoOpcional,
  possuiDeficiencia: textoOpcional,
  contatoMedico: z.object({
    nome: textoOpcional,
    email: emailOpcional,
    telefone: textoOpcional,
  }),
  sinaisVitais: z.object({
    pressaoArterial: pressaoOpcional,
    frequenciaCardiaca: numeroOpcional(20, 250, 'Informe entre 20 e 250 bpm'),
    temperatura: numeroOpcional(30, 45, 'Informe entre 30 e 45 °C'),
    saturacaoOxigenio: numeroOpcional(0, 100, 'Informe entre 0 e 100%'),
  }),
  observacoes: textoOpcional,
});

/** O que o formulário entrega (tudo texto, menos os booleanos e o sexo). */
export type PerfilFormInput = z.input<typeof perfilSchema>;
/** O que o use case recebe, já convertido. */
export type PerfilFormOutput = z.output<typeof perfilSchema>;

const txt = (v: string | number | null) => (v === null ? '' : String(v));

/** Entidade → valores iniciais do formulário. */
export function perfilParaFormulario(p: PerfilSaude): PerfilFormInput {
  return {
    idade: txt(p.idade),
    peso: txt(p.peso),
    altura: txt(p.altura),
    sexo: p.sexo,
    cpf: txt(p.cpf),
    dataNascimento: dataParaBR(p.dataNascimento),
    telefone: txt(p.telefone),
    fuma: p.fuma,
    bebe: p.bebe,
    alergias: txt(p.alergias),
    alergiaMedicamento: txt(p.alergiaMedicamento),
    medicamentosEmUso: txt(p.medicamentosEmUso),
    doencasPreexistentes: txt(p.doencasPreexistentes),
    historicoFamiliar: txt(p.historicoFamiliar),
    possuiDeficiencia: txt(p.possuiDeficiencia),
    contatoMedico: {
      nome: txt(p.contatoMedico.nome),
      email: txt(p.contatoMedico.email),
      telefone: txt(p.contatoMedico.telefone),
    },
    sinaisVitais: {
      pressaoArterial: txt(p.sinaisVitais.pressaoArterial),
      frequenciaCardiaca: txt(p.sinaisVitais.frequenciaCardiaca),
      temperatura: txt(p.sinaisVitais.temperatura),
      saturacaoOxigenio: txt(p.sinaisVitais.saturacaoOxigenio),
    },
    observacoes: txt(p.observacoes),
  };
}
