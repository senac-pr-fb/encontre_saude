import { perfilSchema, perfilParaFormulario, type PerfilFormInput } from '../perfilSchema';
import { perfilVazio } from '@domain/entities/PerfilSaude';

const formularioValido: PerfilFormInput = {
  idade: '30',
  peso: '70',
  altura: '1,75',
  sexo: 'Masculino',
  cpf: '123.456.789-01',
  dataNascimento: '25/04/2001',
  telefone: '11987654321',
  fuma: false,
  bebe: false,
  alergias: '',
  alergiaMedicamento: '',
  medicamentosEmUso: '',
  doencasPreexistentes: '',
  historicoFamiliar: '',
  possuiDeficiencia: '',
  contatoMedico: { nome: '', email: '', telefone: '' },
  sinaisVitais: { pressaoArterial: '120/80', frequenciaCardiaca: '70', temperatura: '36,5', saturacaoOxigenio: '98' },
  observacoes: '',
};

describe('perfilSchema', () => {
  it('converte um formulário totalmente preenchido para o formato da entidade', () => {
    const resultado = perfilSchema.parse(formularioValido);

    expect(resultado.idade).toBe(30);
    expect(resultado.peso).toBe(70);
    expect(resultado.altura).toBe(1.75);
    expect(resultado.cpf).toBe('12345678901');
    expect(resultado.dataNascimento).toBe('2001-04-25');
    expect(resultado.sinaisVitais.frequenciaCardiaca).toBe(70);
    expect(resultado.sinaisVitais.temperatura).toBe(36.5);
  });

  it('converte campos opcionais vazios para null', () => {
    const resultado = perfilSchema.parse(formularioValido);
    expect(resultado.alergias).toBeNull();
    expect(resultado.contatoMedico.nome).toBeNull();
    expect(resultado.contatoMedico.email).toBeNull();
  });

  it('rejeita idade fora do intervalo permitido', () => {
    const result = perfilSchema.safeParse({ ...formularioValido, idade: '200' });
    expect(result.success).toBe(false);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    const result = perfilSchema.safeParse({ ...formularioValido, cpf: '123' });
    expect(result.success).toBe(false);
  });

  it('rejeita data de nascimento inválida', () => {
    const result = perfilSchema.safeParse({ ...formularioValido, dataNascimento: '31/02/2001' });
    expect(result.success).toBe(false);
  });

  it('rejeita pressão arterial fora do formato esperado', () => {
    const result = perfilSchema.safeParse({
      ...formularioValido,
      sinaisVitais: { ...formularioValido.sinaisVitais, pressaoArterial: 'alta' },
    });
    expect(result.success).toBe(false);
  });

  it('rejeita e-mail de contato médico inválido', () => {
    const result = perfilSchema.safeParse({
      ...formularioValido,
      contatoMedico: { ...formularioValido.contatoMedico, email: 'não-é-email' },
    });
    expect(result.success).toBe(false);
  });
});

describe('perfilParaFormulario', () => {
  it('converte um perfil vazio em strings vazias para o formulário', () => {
    const formulario = perfilParaFormulario(perfilVazio('user-1'));

    expect(formulario.idade).toBe('');
    expect(formulario.sexo).toBeNull();
    expect(formulario.fuma).toBe(false);
    expect(formulario.contatoMedico.nome).toBe('');
    expect(formulario.sinaisVitais.pressaoArterial).toBe('');
  });

  it('converte a data de nascimento para o formato dd/mm/aaaa', () => {
    const perfil = { ...perfilVazio('user-1'), dataNascimento: '2001-04-25' };
    expect(perfilParaFormulario(perfil).dataNascimento).toBe('25/04/2001');
  });
});
