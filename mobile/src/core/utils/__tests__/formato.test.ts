import {
  soDigitos,
  mascararCPF,
  mascararTelefone,
  dataParaBR,
  dataParaISO,
  mascararData,
  ehDataNascimentoValida,
} from '../formato';

describe('soDigitos', () => {
  it('remove tudo que não é dígito', () => {
    expect(soDigitos('123.456-78/90')).toBe('1234567890');
  });

  it('mantém string vazia se não houver dígitos', () => {
    expect(soDigitos('abc')).toBe('');
  });
});

describe('mascararCPF', () => {
  it('formata CPF completo', () => {
    expect(mascararCPF('12345678901')).toBe('123.456.789-01');
  });

  it('formata parcialmente enquanto o usuário digita', () => {
    expect(mascararCPF('123')).toBe('123');
    expect(mascararCPF('1234')).toBe('123.4');
    expect(mascararCPF('1234567')).toBe('123.456.7');
  });

  it('ignora caracteres não numéricos e trunca em 11 dígitos', () => {
    expect(mascararCPF('123.456.789-01999')).toBe('123.456.789-01');
  });
});

describe('mascararTelefone', () => {
  it('formata celular com 11 dígitos', () => {
    expect(mascararTelefone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formata parcialmente enquanto o usuário digita', () => {
    expect(mascararTelefone('1')).toBe('(1');
    expect(mascararTelefone('11')).toBe('(11');
    expect(mascararTelefone('1198765')).toBe('(11) 9876-5');
  });

  it('trunca em 11 dígitos', () => {
    expect(mascararTelefone('119876543219999')).toBe('(11) 98765-4321');
  });
});

describe('dataParaBR', () => {
  it('converte ISO para dd/mm/aaaa', () => {
    expect(dataParaBR('2001-04-25')).toBe('25/04/2001');
  });

  it('retorna string vazia para null', () => {
    expect(dataParaBR(null)).toBe('');
  });

  it('retorna string vazia para ISO incompleto', () => {
    expect(dataParaBR('2001-04')).toBe('');
  });
});

describe('dataParaISO', () => {
  it('converte dd/mm/aaaa para ISO', () => {
    expect(dataParaISO('25/04/2001')).toBe('2001-04-25');
  });

  it('devolve o texto cru se ainda estiver incompleto', () => {
    expect(dataParaISO('25/04')).toBe('25/04');
  });
});

describe('mascararData', () => {
  it('aplica a máscara dd/mm/aaaa enquanto digita', () => {
    expect(mascararData('25')).toBe('25');
    expect(mascararData('2504')).toBe('25/04');
    expect(mascararData('25042001')).toBe('25/04/2001');
  });
});

describe('ehDataNascimentoValida', () => {
  it('aceita uma data válida no passado', () => {
    expect(ehDataNascimentoValida('2001-04-25')).toBe(true);
  });

  it('rejeita formato inválido', () => {
    expect(ehDataNascimentoValida('25/04/2001')).toBe(false);
  });

  it('rejeita dia inexistente no mês (31/02)', () => {
    expect(ehDataNascimentoValida('2001-02-31')).toBe(false);
  });

  it('rejeita ano fora do intervalo razoável', () => {
    expect(ehDataNascimentoValida('1899-01-01')).toBe(false);
  });

  it('rejeita mês inválido', () => {
    expect(ehDataNascimentoValida('2001-13-01')).toBe(false);
  });

  it('rejeita data no futuro', () => {
    const anoQueVem = new Date().getFullYear() + 1;
    expect(ehDataNascimentoValida(`${anoQueVem}-01-01`)).toBe(false);
  });
});
