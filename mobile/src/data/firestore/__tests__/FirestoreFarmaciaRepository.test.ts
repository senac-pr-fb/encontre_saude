import { FirestoreFarmaciaRepository } from '../FirestoreFarmaciaRepository';
import type { FirestoreDoc } from '../client';

jest.mock('@core/config/env', () => ({
  env: { firebaseProjectId: 'projeto-teste', firebaseApiKey: 'chave-teste', supabaseUrl: 'x', supabaseAnonKey: 'y' },
}));

function respostaFetch(corpo: unknown) {
  return { ok: true, status: 200, json: jest.fn().mockResolvedValue(corpo) } as unknown as Response;
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function doc(nome: string, fields: FirestoreDoc['fields']): FirestoreDoc {
  return { name: `projects/x/documents/pharmacies/${nome}`, fields };
}

describe('FirestoreFarmaciaRepository.listar', () => {
  it('converte, descarta inválidos e ordena por nome', async () => {
    const documentos = [
      doc('2', {
        nome: { stringValue: 'Zeta Farma' },
        bairro: { stringValue: 'Centro' },
        tipo: { stringValue: 'privada' },
        lat: { doubleValue: -26.08 },
        lng: { doubleValue: -53.05 },
      }),
      doc('1', {
        nome: { stringValue: 'Alfa Farma' },
        bairro: { stringValue: 'Água Branca' },
        tipo: { stringValue: 'Municipal' },
        lat: { doubleValue: -26.09 },
        lng: { doubleValue: -53.06 },
      }),
      // sem nome: deve ser descartado
      doc('3', { lat: { doubleValue: -26.1 }, lng: { doubleValue: -53.1 } }),
      // sem coordenadas: deve ser descartado
      doc('4', { nome: { stringValue: 'Sem Local' } }),
    ];
    globalThis.fetch = jest.fn().mockResolvedValue(respostaFetch({ documents: documentos }));

    const resultado = await new FirestoreFarmaciaRepository().listar();

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.value.map((f) => f.nome)).toEqual(['Alfa Farma', 'Zeta Farma']);
    expect(resultado.value[0].bairro).toBe('Água Branca');
    expect(resultado.value[1].tipo).toBe('Privada');
  });

  it('usa "Sem bairro" quando o campo bairro está ausente', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      respostaFetch({
        documents: [doc('1', { nome: { stringValue: 'Farma' }, lat: { doubleValue: 1 }, lng: { doubleValue: 2 } })],
      }),
    );

    const resultado = await new FirestoreFarmaciaRepository().listar();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value[0].bairro).toBe('Sem bairro');
  });

  it('usa "Privada" como tipo padrão quando o valor não é reconhecido', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      respostaFetch({
        documents: [
          doc('1', {
            nome: { stringValue: 'Farma' },
            tipo: { stringValue: 'desconhecido' },
            lat: { doubleValue: 1 },
            lng: { doubleValue: 2 },
          }),
        ],
      }),
    );

    const resultado = await new FirestoreFarmaciaRepository().listar();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value[0].tipo).toBe('Privada');
  });

  it('usa location (geoPoint) quando lat/lng não estão presentes', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      respostaFetch({
        documents: [
          doc('1', {
            nome: { stringValue: 'Farma' },
            location: { geoPointValue: { latitude: -26.5, longitude: -53.5 } },
          }),
        ],
      }),
    );

    const resultado = await new FirestoreFarmaciaRepository().listar();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value[0]).toEqual(expect.objectContaining({ lat: -26.5, lng: -53.5 }));
  });

  it('propaga o erro quando a busca no Firestore falha', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('sem conexão'));

    const resultado = await new FirestoreFarmaciaRepository().listar();

    expect(resultado.ok).toBe(false);
  });
});
