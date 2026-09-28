import type { PreProntuario } from '@domain/entities/PreProntuario';

export interface PdfGerado {
  uri: string;
  compartilhavel: boolean;
}

/** Geração, impressão e envio do PDF do pré-prontuário. */
export interface ProntuarioPdfService {
  gerar(prontuario: PreProntuario): Promise<PdfGerado>;
  imprimir(prontuario: PreProntuario): Promise<void>;
  compartilhar(uri: string): Promise<void>;
}
