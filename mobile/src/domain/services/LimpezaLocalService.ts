/**
 * Apaga do aparelho tudo o que o app guardou do usuário fora da sessão:
 * rascunho do pré-prontuário, última triagem, marcas de fluxo e PDFs gerados.
 * Roda no logout, para o próximo usuário do aparelho não herdar nada.
 * Nunca falha: um arquivo que não pôde ser apagado não impede o logout.
 */
export interface LimpezaLocalService {
  limpar(): Promise<void>;
}
