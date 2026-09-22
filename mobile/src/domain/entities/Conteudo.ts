/**
 * Conteudo editorial do app (primeiros socorros e prevencao).
 * Nao e dado de usuario nem vem de banco: mora em src/data/static, tipado.
 * Se um dia virar tabela, cria-se um ConteudoRepository e so a origem muda.
 */

export type BlocoConteudo =
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'paragrafo'; texto: string; destaque?: boolean }
  | { tipo: 'lista'; itens: string[] };

export interface TopicoSocorro {
  id: string;
  titulo: string;
  blocos: BlocoConteudo[];
  /** Id do video no YouTube; o site embute a URL completa num <iframe>. */
  video: string | null;
}

export interface TopicoPrevencao {
  id: string;
  titulo: string;
  /** URL externa; pode falhar ao carregar, entao a UI trata o erro. */
  imagem: string | null;
  paragrafos: string[];
}

/** Icone do FontAwesome6 por topico de primeiros socorros. */
export const ICONES_SOCORRO: Record<string, string> = {
  engasgo: 'lungs',
  'massagem-cardiaca': 'heart-pulse',
  desmaio: 'bed-pulse',
  convulsao: 'bolt',
  intoxicacao: 'skull-crossbones',
  afogamento: 'water',
  queimadura: 'fire',
  'transporte-de-vitimas': 'truck-medical',
  fratura: 'bone',
};

/** Telefones de emergencia citados no conteudo. */
export const EMERGENCIAS = [
  { nome: 'SAMU', numero: '192', icone: 'truck-medical' },
  { nome: 'Bombeiros', numero: '193', icone: 'fire-extinguisher' },
  { nome: 'Intoxicação (CIAT)', numero: '08007226001', rotulo: '0800 722 6001', icone: 'flask' },
] as const;
