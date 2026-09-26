import { perfilMapper } from '../perfilMapper';
import type { DadosSaudeDTO } from '@data/dto/DadosSaudeDTO';
import type { PerfilSaude } from '@domain/entities/PerfilSaude';

const dtoBase: DadosSaudeDTO = {
  user_id: 'user-1',
  idade: 30,
  peso: 70,
  altura: 1.75,
  sexo: 'Masculino',
  CPF: '123.456.789-01',
  data_nascimento: '2001-04-25',
  telefone: '11987654321',
  fuma: true,
  bebe: false,
  alergias: 'Poeira',
  alergia_medicamento: null,
  medicamentos_em_uso: null,
  doencas_preexistentes: null,
  historico_familiar: null,
  possui_deficiencia: null,
  contato_medico_particular: { nome: 'Dr. João', email: 'dr@joao.com', telefone: null },
  pressao_arterial: '120/80',
  frequencia_cardiaca: 70,
  temperatura: 36.5,
  saturacao_oxigenio: 98,
  observacoes: null,
};

describe('perfilMapper.toEntity', () => {
  it('converte o DTO snake_case para a entidade PerfilSaude', () => {
    const entidade = perfilMapper.toEntity(dtoBase);

    expect(entidade.userId).toBe('user-1');
    expect(entidade.dataNascimento).toBe('2001-04-25');
    expect(entidade.cpf).toBe('12345678901');
    expect(entidade.contatoMedico).toEqual({ nome: 'Dr. João', email: 'dr@joao.com', telefone: null });
    expect(entidade.sinaisVitais).toEqual({
      pressaoArterial: '120/80',
      frequenciaCardiaca: 70,
      temperatura: 36.5,
      saturacaoOxigenio: 98,
    });
  });

  it('descarta um sexo que não está na lista de valores válidos', () => {
    const entidade = perfilMapper.toEntity({ ...dtoBase, sexo: 'invalido' });
    expect(entidade.sexo).toBeNull();
  });

  it('trata fuma/bebe nulos como false', () => {
    const entidade = perfilMapper.toEntity({ ...dtoBase, fuma: null, bebe: null });
    expect(entidade.fuma).toBe(false);
    expect(entidade.bebe).toBe(false);
  });

  it('trata CPF nulo como null', () => {
    const entidade = perfilMapper.toEntity({ ...dtoBase, CPF: null });
    expect(entidade.cpf).toBeNull();
  });

  it('lê contato médico gravado como string legada (versões antigas)', () => {
    const entidade = perfilMapper.toEntity({ ...dtoBase, contato_medico_particular: '  Dr. Antigo  ' });
    expect(entidade.contatoMedico).toEqual({ nome: 'Dr. Antigo', email: null, telefone: null });
  });

  it('lê contato médico ausente/vazio como objeto vazio', () => {
    const entidade = perfilMapper.toEntity({ ...dtoBase, contato_medico_particular: null });
    expect(entidade.contatoMedico).toEqual({ nome: null, email: null, telefone: null });
  });
});

describe('perfilMapper.toDTO', () => {
  it('converte a entidade PerfilSaude para o DTO snake_case', () => {
    const perfil: PerfilSaude = {
      userId: 'user-1',
      idade: 30,
      peso: 70,
      altura: 1.75,
      sexo: 'Masculino',
      cpf: '12345678901',
      dataNascimento: '2001-04-25',
      telefone: '11987654321',
      fuma: true,
      bebe: false,
      alergias: 'Poeira',
      alergiaMedicamento: null,
      medicamentosEmUso: null,
      doencasPreexistentes: null,
      historicoFamiliar: null,
      possuiDeficiencia: null,
      contatoMedico: { nome: 'Dr. João', email: 'dr@joao.com', telefone: null },
      sinaisVitais: { pressaoArterial: '120/80', frequenciaCardiaca: 70, temperatura: 36.5, saturacaoOxigenio: 98 },
      observacoes: null,
    };

    const dto = perfilMapper.toDTO(perfil);

    expect(dto.user_id).toBe('user-1');
    expect(dto.CPF).toBe('12345678901');
    expect(dto.data_nascimento).toBe('2001-04-25');
    expect(dto.contato_medico_particular).toEqual({ nome: 'Dr. João', email: 'dr@joao.com', telefone: null });
    expect(dto.pressao_arterial).toBe('120/80');
  });

  it('é o inverso de toEntity para os campos simples', () => {
    const entidade = perfilMapper.toEntity(dtoBase);
    const dto = perfilMapper.toDTO(entidade);

    expect(dto.CPF).toBe('12345678901');
    expect(dto.data_nascimento).toBe(dtoBase.data_nascimento);
    expect(dto.pressao_arterial).toBe(dtoBase.pressao_arterial);
  });
});
