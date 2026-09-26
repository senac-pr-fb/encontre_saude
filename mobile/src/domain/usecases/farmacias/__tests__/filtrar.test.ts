import { filtrarFarmacias, bairrosDe, distanciaKm, FILTRO_INICIAL } from '../filtrar';
import type { Farmacia } from '@domain/entities/Farmacia';

const farmacia = (overrides: Partial<Farmacia>): Farmacia => ({
  id: '1',
  nome: 'Farmácia Central',
  endereco: 'Rua A, 123',
  bairro: 'Centro',
  telefone: null,
  horario: null,
  site: null,
  instagram: null,
  tipo: 'Municipal',
  lat: -26.08,
  lng: -53.05,
  ...overrides,
});

const lista: Farmacia[] = [
  farmacia({ id: '1', nome: 'Farmácia Central', bairro: 'Centro', tipo: 'Municipal' }),
  farmacia({ id: '2', nome: 'Drogaria Popular', bairro: 'Água Branca', tipo: 'Privada' }),
  farmacia({ id: '3', nome: 'Farmácia do Bairro', bairro: 'Centro', tipo: 'Privada' }),
];

describe('filtrarFarmacias', () => {
  it('sem filtro de texto/bairro, respeita apenas os tipos', () => {
    const resultado = filtrarFarmacias(lista, FILTRO_INICIAL);
    expect(resultado).toHaveLength(3);
  });

  it('filtra por termo no nome (case-insensitive)', () => {
    const resultado = filtrarFarmacias(lista, { ...FILTRO_INICIAL, termo: 'central' });
    expect(resultado.map((f) => f.id)).toEqual(['1']);
  });

  it('filtra por termo no bairro', () => {
    const resultado = filtrarFarmacias(lista, { ...FILTRO_INICIAL, termo: 'água branca' });
    expect(resultado.map((f) => f.id)).toEqual(['2']);
  });

  it('filtra por bairro exato', () => {
    const resultado = filtrarFarmacias(lista, { ...FILTRO_INICIAL, bairro: 'Centro' });
    expect(resultado.map((f) => f.id).sort()).toEqual(['1', '3']);
  });

  it('filtra por tipo', () => {
    const resultado = filtrarFarmacias(lista, { ...FILTRO_INICIAL, tipos: ['Municipal'] });
    expect(resultado.map((f) => f.id)).toEqual(['1']);
  });

  it('combina texto, bairro e tipo', () => {
    const resultado = filtrarFarmacias(lista, { termo: 'farmácia', bairro: 'Centro', tipos: ['Privada'] });
    expect(resultado.map((f) => f.id)).toEqual(['3']);
  });
});

describe('bairrosDe', () => {
  it('retorna bairros únicos ordenados alfabeticamente', () => {
    expect(bairrosDe(lista)).toEqual(['Água Branca', 'Centro']);
  });

  it('retorna lista vazia para lista vazia', () => {
    expect(bairrosDe([])).toEqual([]);
  });
});

describe('distanciaKm', () => {
  it('retorna 0 para o mesmo ponto', () => {
    const ponto = { lat: -26.08, lng: -53.05 };
    expect(distanciaKm(ponto, ponto)).toBeCloseTo(0, 5);
  });

  it('calcula uma distância aproximada correta entre dois pontos conhecidos', () => {
    // Francisco Beltrão -> Curitiba, ~285km em linha reta
    const beltrao = { lat: -26.0815, lng: -53.0556 };
    const curitiba = { lat: -25.4284, lng: -49.2733 };
    const distancia = distanciaKm(beltrao, curitiba);
    expect(distancia).toBeGreaterThan(350);
    expect(distancia).toBeLessThan(400);
  });
});
