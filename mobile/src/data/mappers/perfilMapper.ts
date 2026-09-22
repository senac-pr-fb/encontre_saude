import type { ContatoMedico, PerfilSaude, Sexo } from '@domain/entities/PerfilSaude';
import { SEXOS } from '@domain/entities/PerfilSaude';
import type { ContatoMedicoDTO, DadosSaudeDTO } from '@data/dto/DadosSaudeDTO';

const sexoValido = (v: string | null): Sexo | null =>
  v && (SEXOS as readonly string[]).includes(v) ? (v as Sexo) : null;

/** O site já gravou esta coluna como objeto e, antes disso, como string. */
function lerContato(v: DadosSaudeDTO['contato_medico_particular']): ContatoMedico {
  if (v && typeof v === 'object') {
    return { nome: v.nome ?? null, email: v.email ?? null, telefone: v.telefone ?? null };
  }
  if (typeof v === 'string' && v.trim() !== '') {
    return { nome: v.trim(), email: null, telefone: null };
  }
  return { nome: null, email: null, telefone: null };
}

const so = (v: ContatoMedico): ContatoMedicoDTO => ({ nome: v.nome, email: v.email, telefone: v.telefone });

export const perfilMapper = {
  toEntity(d: DadosSaudeDTO): PerfilSaude {
    return {
      userId: d.user_id,
      idade: d.idade,
      peso: d.peso,
      altura: d.altura,
      sexo: sexoValido(d.sexo),
      cpf: d.CPF ? d.CPF.replace(/\D/g, '') : null,
      dataNascimento: d.data_nascimento,
      telefone: d.telefone,
      fuma: d.fuma ?? false,
      bebe: d.bebe ?? false,
      alergias: d.alergias,
      alergiaMedicamento: d.alergia_medicamento,
      medicamentosEmUso: d.medicamentos_em_uso,
      doencasPreexistentes: d.doencas_preexistentes,
      historicoFamiliar: d.historico_familiar,
      possuiDeficiencia: d.possui_deficiencia,
      contatoMedico: lerContato(d.contato_medico_particular),
      sinaisVitais: {
        pressaoArterial: d.pressao_arterial,
        frequenciaCardiaca: d.frequencia_cardiaca,
        temperatura: d.temperatura,
        saturacaoOxigenio: d.saturacao_oxigenio,
      },
      observacoes: d.observacoes,
    };
  },

  toDTO(p: PerfilSaude): DadosSaudeDTO {
    return {
      user_id: p.userId,
      idade: p.idade,
      peso: p.peso,
      altura: p.altura,
      sexo: p.sexo,
      CPF: p.cpf,
      data_nascimento: p.dataNascimento,
      telefone: p.telefone,
      fuma: p.fuma,
      bebe: p.bebe,
      alergias: p.alergias,
      alergia_medicamento: p.alergiaMedicamento,
      medicamentos_em_uso: p.medicamentosEmUso,
      doencas_preexistentes: p.doencasPreexistentes,
      historico_familiar: p.historicoFamiliar,
      possui_deficiencia: p.possuiDeficiencia,
      contato_medico_particular: so(p.contatoMedico),
      pressao_arterial: p.sinaisVitais.pressaoArterial,
      frequencia_cardiaca: p.sinaisVitais.frequenciaCardiaca,
      temperatura: p.sinaisVitais.temperatura,
      saturacao_oxigenio: p.sinaisVitais.saturacaoOxigenio,
      observacoes: p.observacoes,
    };
  },
};
