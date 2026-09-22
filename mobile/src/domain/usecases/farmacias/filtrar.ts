import type { Farmacia, TipoFarmacia } from '@domain/entities/Farmacia';

export interface FiltroFarmacias {
  termo: string;
  bairro: string | null;
  tipos: TipoFarmacia[];
}

export const FILTRO_INICIAL: FiltroFarmacias = { termo: '', bairro: null, tipos: ['Municipal', 'Privada'] };

/** Regra pura, sem I/O: mesma semantica do filtro do site (nome OU bairro). */
export function filtrarFarmacias(lista: Farmacia[], filtro: FiltroFarmacias): Farmacia[] {
  const termo = filtro.termo.trim().toLowerCase();

  return lista.filter((f) => {
    const combinaTexto =
      termo === '' || f.nome.toLowerCase().includes(termo) || f.bairro.toLowerCase().includes(termo);
    const combinaBairro = filtro.bairro === null || f.bairro === filtro.bairro;
    const combinaTipo = filtro.tipos.includes(f.tipo);
    return combinaTexto && combinaBairro && combinaTipo;
  });
}

/**
 * Bairros existentes, derivados das farmacias cadastradas.
 * No site essa lista e fixa no codigo e ja esta desatualizada: faltam
 * Cidade Leste, Industrial e Jardim Italia, que hoje tem farmacia.
 */
export function bairrosDe(lista: Farmacia[]): string[] {
  return [...new Set(lista.map((f) => f.bairro))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Distancia aproximada em km (Haversine) - usada para ordenar por proximidade. */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
