import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import type { TriagemDoHistorico } from '@domain/entities/ContextoSaude';
import { dataParaBR } from '@core/utils/formato';
import { FORMULARIO_VAZIO, type ProntuarioFormInput } from './prontuarioSchema';

const txt = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v));

/**
 * Monta o pré-prontuário a partir do que o app já sabe: ficha de saúde, nome da
 * conta e, se houver, a triagem que vira a queixa. É a única conversão entre o
 * contexto de saúde e o formulário — o documento automático e a edição manual
 * partem daqui.
 */
export function contextoParaFormulario(
  perfil: PerfilSaude | null,
  nome: string | null,
  triagem: TriagemDoHistorico | null = null,
): ProntuarioFormInput {
  return {
    ...FORMULARIO_VAZIO,
    nome: nome ?? '',
    sexo: perfil?.sexo ?? FORMULARIO_VAZIO.sexo,
    cpf: txt(perfil?.cpf),
    dataNascimento: dataParaBR(perfil?.dataNascimento ?? null),
    telefone: txt(perfil?.telefone),
    peso: txt(perfil?.peso),
    altura: txt(perfil?.altura),
    alergias: txt(perfil?.alergias),
    medicamentosEmUso: txt(perfil?.medicamentosEmUso),
    doencasPreexistentes: txt(perfil?.doencasPreexistentes),
    historicoFamiliar: txt(perfil?.historicoFamiliar),
    pressaoArterial: txt(perfil?.sinaisVitais.pressaoArterial),
    frequenciaCardiaca: txt(perfil?.sinaisVitais.frequenciaCardiaca),
    temperatura: txt(perfil?.sinaisVitais.temperatura),
    saturacaoOxigenio: txt(perfil?.sinaisVitais.saturacaoOxigenio),
    // O relato é a queixa; os sintomas já vêm marcados pela IA.
    queixaPrincipal: triagem?.descricao ?? '',
    sintomas: triagem ? [...triagem.triagem.sintomas] : [],
  };
}

/**
 * Rascunho da edição manual por cima do contexto: o que a pessoa digitou vence.
 * Campo deixado em branco no rascunho não apaga o que a ficha ou a triagem
 * trazem — por exemplo, o CPF salvo depois que o rascunho foi gravado.
 */
export function mesclarRascunho(
  doContexto: ProntuarioFormInput,
  rascunho: Partial<ProntuarioFormInput> | null,
): ProntuarioFormInput {
  if (!rascunho) return doContexto;
  const preenchidos = Object.fromEntries(
    Object.entries(rascunho).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : v != null,
    ),
  );
  return { ...doContexto, ...preenchidos };
}
