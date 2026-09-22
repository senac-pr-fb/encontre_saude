export const TIPOS_FARMACIA = ['Municipal', 'Privada'] as const;
export type TipoFarmacia = (typeof TIPOS_FARMACIA)[number];

export interface Farmacia {
  id: string;
  nome: string;
  endereco: string | null;
  bairro: string;
  telefone: string | null;
  horario: string | null;
  site: string | null;
  instagram: string | null;
  tipo: TipoFarmacia;
  lat: number;
  lng: number;
}

/** Centro de Francisco Beltrão — mesma posicao inicial do mapa do site. */
export const CENTRO_FRANCISCO_BELTRAO = { lat: -26.0815, lng: -53.0556 } as const;
