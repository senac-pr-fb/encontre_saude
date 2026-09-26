import { listarColecao, idDoDocumento, texto, numero, geoPonto, type FirestoreDoc } from '../client';

jest.mock('@core/config/env', () => ({
  env: { firebaseProjectId: 'projeto-teste', firebaseApiKey: 'chave-teste', supabaseUrl: 'x', supabaseAnonKey: 'y' },
}));

function respostaFetch(status: number, corpo: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(corpo),
  } as unknown as Response;
}

describe('listarColecao', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('lê uma página única quando não há nextPageToken', async () => {
    const docs: FirestoreDoc[] = [{ name: 'projects/x/documents/pharmacies/1', fields: {} }];
    globalThis.fetch = jest.fn().mockResolvedValue(respostaFetch(200, { documents: docs }));

    const resultado = await listarColecao('pharmacies');

    expect(resultado).toEqual({ ok: true, value: docs });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('segue a paginação até não haver mais nextPageToken', async () => {
    const pagina1 = { documents: [{ name: 'doc1', fields: {} }], nextPageToken: 'abc' };
    const pagina2 = { documents: [{ name: 'doc2', fields: {} }] };
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(respostaFetch(200, pagina1))
      .mockResolvedValueOnce(respostaFetch(200, pagina2));

    const resultado = await listarColecao('pharmacies');

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.map((d) => d.name)).toEqual(['doc1', 'doc2']);
  });

  it('retorna erro específico de permissão quando o Firestore responde 403', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(respostaFetch(403, { error: { message: 'permissão negada' } }));

    const resultado = await listarColecao('pharmacies');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe('FIRESTORE_PERMISSION');
  });

  it('retorna erro genérico para outros status de falha', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(respostaFetch(500, { error: { message: 'erro interno' } }));

    const resultado = await listarColecao('pharmacies');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.message).toBe('erro interno');
  });

  it('retorna NetworkError quando o fetch lança exceção', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('sem conexão'));

    const resultado = await listarColecao('pharmacies');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.code).toBe('NETWORK');
  });
});

describe('idDoDocumento', () => {
  it('extrai o último segmento do caminho', () => {
    expect(idDoDocumento('projects/x/databases/(default)/documents/pharmacies/abc123')).toBe('abc123');
  });
});

describe('texto', () => {
  it('lê stringValue e remove espaços', () => {
    expect(texto({ stringValue: '  Farmácia  ' })).toBe('Farmácia');
  });

  it('devolve null para string vazia', () => {
    expect(texto({ stringValue: '   ' })).toBeNull();
  });

  it('devolve null para valor ausente ou nullValue', () => {
    expect(texto(undefined)).toBeNull();
    expect(texto({ nullValue: null })).toBeNull();
  });
});

describe('numero', () => {
  it('lê doubleValue', () => {
    expect(numero({ doubleValue: 1.5 })).toBe(1.5);
  });

  it('lê integerValue (vem como string) e converte', () => {
    expect(numero({ integerValue: '42' })).toBe(42);
  });

  it('devolve null para valor ausente', () => {
    expect(numero(undefined)).toBeNull();
  });
});

describe('geoPonto', () => {
  it('converte geoPointValue para {lat, lng}', () => {
    expect(geoPonto({ geoPointValue: { latitude: -26.08, longitude: -53.05 } })).toEqual({
      lat: -26.08,
      lng: -53.05,
    });
  });

  it('devolve null quando não é um geoPointValue', () => {
    expect(geoPonto({ stringValue: 'x' })).toBeNull();
  });
});
