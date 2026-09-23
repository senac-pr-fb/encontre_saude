import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as LegacyFS from 'expo-file-system/legacy';
import type { PreProntuario } from '@domain/entities/PreProntuario';
import { rotuloDoSintoma } from '@domain/entities/PreProntuario';
import { dataParaBR, mascararCPF, mascararTelefone } from '@core/utils/formato';

/**
 * PDF do pré-prontuário.
 *
 * O site desenha o documento coordenada a coordenada com jsPDF (130 linhas de
 * `doc.text(x, y)`). Aqui o caminho é HTML → `expo-print`, que usa o motor de
 * impressão do próprio sistema: o layout vira CSS, a paginação é automática e
 * o arquivo sai no mesmo A4. Menos código e mais fácil de mudar.
 */

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

const ou = (v: string | number | null, alternativa = 'Não informado') =>
  v === null || v === '' ? alternativa : esc(String(v));

const campo = (rotulo: string, valor: string | number | null) => `
  <div class="campo">
    <span class="rotulo">${rotulo}</span>
    <span class="valor">${ou(valor)}</span>
  </div>`;

const secao = (titulo: string, conteudo: string) => `
  <section>
    <h2>${titulo}</h2>
    ${conteudo}
  </section>`;

function montarHtml(p: PreProntuario): string {
  const agora = new Date().toLocaleString('pt-BR');
  const sintomas = p.sintomas.length
    ? p.sintomas.map((s) => `<span class="tag">${esc(rotuloDoSintoma(s))}</span>`).join('')
    : '<span class="vazio">Nenhum sintoma selecionado.</span>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #2D3436; margin: 0; padding: 32px 36px; font-size: 11px; }
  header { background: #2A5C43; color: #fff; margin: -32px -36px 24px; padding: 20px 36px; }
  header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
  header p { margin: 4px 0 0; font-size: 10px; opacity: 0.85; }
  header .data { float: right; font-size: 10px; opacity: 0.85; }
  section { margin-bottom: 18px; page-break-inside: avoid; }
  h2 { background: #E8F5E9; color: #2A5C43; font-size: 12px; margin: 0 0 10px; padding: 6px 10px; border-radius: 4px; }
  .grade { display: flex; flex-wrap: wrap; }
  .campo { width: 50%; padding: 0 8px 10px 0; }
  .campo.largo { width: 100%; }
  .rotulo { display: block; font-size: 9px; color: #636E72; text-transform: uppercase; letter-spacing: 0.4px; }
  .valor { display: block; font-size: 12px; font-weight: bold; margin-top: 2px; }
  .tag { display: inline-block; background: #E8F5E9; color: #2A5C43; border-radius: 10px; padding: 3px 9px; margin: 0 4px 4px 0; font-size: 10px; font-weight: bold; }
  .vazio { color: #636E72; font-style: italic; }
  footer { margin-top: 28px; border-top: 1px solid #EBEBEB; padding-top: 10px; font-size: 9px; color: #636E72; text-align: center; }
</style>
</head>
<body>
  <header>
    <span class="data">Gerado em: ${esc(agora)}</span>
    <h1>ENCONTRE SAÚDE</h1>
    <p>Pré-Prontuário Digital | Documento Confidencial</p>
  </header>

  ${secao(
    'Dados do paciente',
    `<div class="grade">
      ${campo('Nome completo', p.nome)}
      ${campo('Data de nascimento', dataParaBR(p.dataNascimento))}
      ${campo('CPF', mascararCPF(p.cpf))}
      ${campo('Sexo biológico', p.sexo)}
      ${campo('Telefone', mascararTelefone(p.telefone))}
    </div>`,
  )}

  ${secao(
    'Queixa principal',
    `<div class="grade">
      <div class="campo largo"><span class="valor">${ou(p.queixaPrincipal)}</span></div>
      ${campo('Há quanto tempo', p.tempoSintoma)}
    </div>
    <div style="margin-top:6px">${sintomas}</div>`,
  )}

  ${secao(
    'Sinais vitais',
    `<div class="grade">
      ${campo('Pressão arterial', p.pressaoArterial)}
      ${campo('Frequência cardíaca', p.frequenciaCardiaca ? `${p.frequenciaCardiaca} bpm` : null)}
      ${campo('Temperatura', p.temperatura ? `${p.temperatura} °C` : null)}
      ${campo('Saturação de O₂', p.saturacaoOxigenio ? `${p.saturacaoOxigenio}%` : null)}
      ${campo('Peso', p.peso ? `${p.peso} kg` : null)}
      ${campo('Altura', p.altura ? `${p.altura} m` : null)}
    </div>`,
  )}

  ${secao(
    'Histórico clínico',
    `<div class="grade">
      <div class="campo largo"><span class="rotulo">Alergias</span><span class="valor">${ou(p.alergias)}</span></div>
      <div class="campo largo"><span class="rotulo">Medicamentos em uso</span><span class="valor">${ou(p.medicamentosEmUso)}</span></div>
      <div class="campo largo"><span class="rotulo">Doenças preexistentes</span><span class="valor">${ou(p.doencasPreexistentes)}</span></div>
      <div class="campo largo"><span class="rotulo">Histórico familiar</span><span class="valor">${ou(p.historicoFamiliar)}</span></div>
      <div class="campo largo"><span class="rotulo">Observações</span><span class="valor">${ou(p.observacoes)}</span></div>
    </div>`,
  )}

  <footer>
    Documento preenchido pelo próprio paciente no aplicativo Encontre Saúde.<br>
    Não substitui avaliação médica. Em emergência, ligue 192.
  </footer>
</body>
</html>`;
}

export interface PdfGerado {
  uri: string;
  compartilhavel: boolean;
}

/**
 * Gera o arquivo e devolve o caminho local.
 *
 * O `printToFileAsync` escreve num diretório do módulo de impressão com um nome
 * aleatório, de onde o compartilhamento não consegue ler ("Not allowed to read
 * file under given URL"). Copiar para o cache do app resolve e ainda dá ao
 * arquivo um nome decente — é esse nome que o destinatário vê.
 *
 * A cópia usa a API legada de propósito: a nova (`File`/`Paths`, SDK 54+) aplica
 * um modelo de permissões que recusa ler o arquivo do módulo de impressão
 * ("Missing 'READ' permission for accessing the file").
 */
export async function gerarPdfProntuario(p: PreProntuario): Promise<PdfGerado> {
  // base64 em vez do caminho: no Expo Go o arquivo impresso vai para
  // `cache/Print/`, fora da sandbox do app, e nem a API de arquivos nem o
  // compartilhamento conseguem lê-lo ("isn't readable"). Recebendo o conteúdo
  // direto, escrevemos o PDF no diretório do app sem precisar ler a origem.
  const { uri, base64 } = await Print.printToFileAsync({ html: montarHtml(p), base64: true });
  const compartilhavel = await Sharing.isAvailableAsync();

  // documentDirectory, não cacheDirectory: é o que o expo-sharing reconhece
  // como legível ao checar as permissões do caminho no Android.
  const destino = `${LegacyFS.documentDirectory}pre-prontuario-${new Date().toISOString().slice(0, 10)}.pdf`;

  try {
    if (!base64) throw new Error('A impressão não devolveu o conteúdo do PDF.');
    await LegacyFS.writeAsStringAsync(destino, base64, { encoding: LegacyFS.EncodingType.Base64 });
    if (__DEV__) console.log('[pdf] gravado em', destino);
    return { uri: destino, compartilhavel };
  } catch (e) {
    if (__DEV__) console.log('[pdf] gravação falhou, usando o original:', uri, e);
    return { uri, compartilhavel };
  }
}

/**
 * Caminho alternativo: abre o diálogo de impressão do sistema, que oferece
 * "Salvar como PDF" no Android e a folha de compartilhamento no iOS. Não passa
 * pelo sistema de arquivos, então funciona mesmo quando o compartilhamento
 * direto esbarra em permissão de leitura.
 */
export async function imprimirProntuario(p: PreProntuario): Promise<void> {
  await Print.printAsync({ html: montarHtml(p) });
}

/**
 * Abre o menu nativo de compartilhamento. Substitui os canais simulados do
 * site (e-mail e WhatsApp): aqui o próprio sistema oferece os dois, além de
 * salvar o arquivo, e o envio acontece de verdade.
 */
export async function compartilharPdf(uri: string): Promise<void> {
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Pré-prontuário',
    UTI: 'com.adobe.pdf',
  });
}
