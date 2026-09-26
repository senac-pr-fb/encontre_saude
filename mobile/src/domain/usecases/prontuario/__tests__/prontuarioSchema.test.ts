import { prontuarioSchema, FORMULARIO_VAZIO, CAMPOS_POR_ETAPA, type ProntuarioFormInput } from '../prontuarioSchema';

const formularioValido: ProntuarioFormInput = {
  ...FORMULARIO_VAZIO,
  nome: 'João da Silva',
  dataNascimento: '25/04/2001',
  cpf: '123.456.789-01',
  sexo: 'Masculino',
  telefone: '11987654321',
  queixaPrincipal: 'Dor de cabeça forte há dois dias',
  tempoSintoma: '2 dias',
  sintomas: ['febre', 'tosse'],
  pressaoArterial: '120/80',
  frequenciaCardiaca: '70',
  temperatura: '36,5',
  saturacaoOxigenio: '98',
  peso: '70',
  altura: '1,75',
};

describe('prontuarioSchema', () => {
  it('converte um formulário válido para o formato da entidade', () => {
    const resultado = prontuarioSchema.parse(formularioValido);

    expect(resultado.nome).toBe('João da Silva');
    expect(resultado.dataNascimento).toBe('2001-04-25');
    expect(resultado.cpf).toBe('12345678901');
    expect(resultado.sintomas).toEqual(['febre', 'tosse']);
    expect(resultado.frequenciaCardiaca).toBe(70);
    expect(resultado.temperatura).toBe(36.5);
  });

  it('converte campos clínicos opcionais vazios em null', () => {
    const resultado = prontuarioSchema.parse(formularioValido);
    expect(resultado.alergias).toBeNull();
    expect(resultado.observacoes).toBeNull();
  });

  it('rejeita nome muito curto', () => {
    const result = prontuarioSchema.safeParse({ ...formularioValido, nome: 'Jo' });
    expect(result.success).toBe(false);
  });

  it('rejeita data de nascimento inválida', () => {
    const result = prontuarioSchema.safeParse({ ...formularioValido, dataNascimento: '31/02/2001' });
    expect(result.success).toBe(false);
  });

  it('rejeita CPF incompleto', () => {
    const result = prontuarioSchema.safeParse({ ...formularioValido, cpf: '123' });
    expect(result.success).toBe(false);
  });

  it('rejeita telefone sem DDD', () => {
    const result = prontuarioSchema.safeParse({ ...formularioValido, telefone: '987654321' });
    expect(result.success).toBe(false);
  });

  it('rejeita queixa principal muito curta', () => {
    const result = prontuarioSchema.safeParse({ ...formularioValido, queixaPrincipal: 'dor' });
    expect(result.success).toBe(false);
  });

  it('rejeita sintoma que não existe na lista', () => {
    const result = prontuarioSchema.safeParse({ ...formularioValido, sintomas: ['sintoma_inexistente'] });
    expect(result.success).toBe(false);
  });
});

describe('CAMPOS_POR_ETAPA', () => {
  it('define os campos de cada uma das 4 etapas', () => {
    expect(CAMPOS_POR_ETAPA[1]).toContain('nome');
    expect(CAMPOS_POR_ETAPA[2]).toContain('queixaPrincipal');
    expect(CAMPOS_POR_ETAPA[3]).toContain('pressaoArterial');
    expect(CAMPOS_POR_ETAPA[4]).toEqual([]);
  });
});
