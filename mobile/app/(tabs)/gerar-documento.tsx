import { Redirect } from 'expo-router';

/**
 * Só reserva o lugar do botão central na navbar, que abre o documento por
 * cima das abas. Se a rota for aberta por link, leva ao mesmo destino.
 */
export default function GerarDocumento() {
  return <Redirect href="/pre-prontuario" />;
}
