import { ok, err, unwrap } from '../result';

describe('ok', () => {
  it('cria um Result de sucesso com o valor', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });
});

describe('err', () => {
  it('cria um Result de falha com o erro', () => {
    const error = new Error('falhou');
    expect(err(error)).toEqual({ ok: false, error });
  });
});

describe('unwrap', () => {
  it('devolve o valor quando o Result é de sucesso', () => {
    expect(unwrap(ok('valor'))).toBe('valor');
  });

  it('lança o erro quando o Result é de falha', () => {
    const error = new Error('deu ruim');
    expect(() => unwrap(err(error))).toThrow(error);
  });
});
