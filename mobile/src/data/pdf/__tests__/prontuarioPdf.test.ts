import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as LegacyFS from 'expo-file-system/legacy';
import { gerarPdfProntuario, imprimirProntuario, compartilharPdf } from '../prontuarioPdf';
import type { PreProntuario } from '@domain/entities/PreProntuario';

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn(), printAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documentos/',
  writeAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

const preProntuario: PreProntuario = {
  nome: 'João da Silva',
  dataNascimento: '2001-04-25',
  cpf: '12345678901',
  sexo: 'Masculino',
  telefone: '11987654321',
  queixaPrincipal: 'Dor de cabeça forte',
  tempoSintoma: '2 dias',
  sintomas: ['febre'],
  alergias: null,
  medicamentosEmUso: null,
  doencasPreexistentes: null,
  historicoFamiliar: null,
  pressaoArterial: null,
  frequenciaCardiaca: null,
  temperatura: null,
  saturacaoOxigenio: null,
  peso: 70,
  altura: 1.75,
  observacoes: null,
};

describe('gerarPdfProntuario', () => {
  it('grava o base64 no diretório de documentos e devolve o caminho final', async () => {
    (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///cache/print-original.pdf', base64: 'QUJD' });
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (LegacyFS.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

    const resultado = await gerarPdfProntuario(preProntuario);

    expect(Print.printToFileAsync).toHaveBeenCalledWith(expect.objectContaining({ base64: true }));
    expect(LegacyFS.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringMatching(/^file:\/\/\/documentos\/pre-prontuario-\d{4}-\d{2}-\d{2}\.pdf$/),
      'QUJD',
      { encoding: 'base64' },
    );
    expect(resultado.compartilhavel).toBe(true);
    expect(resultado.uri).toMatch(/^file:\/\/\/documentos\/pre-prontuario-/);
  });

  it('devolve o uri original quando a impressão não retorna base64', async () => {
    (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///cache/print-original.pdf', base64: null });
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    const resultado = await gerarPdfProntuario(preProntuario);

    expect(LegacyFS.writeAsStringAsync).not.toHaveBeenCalled();
    expect(resultado).toEqual({ uri: 'file:///cache/print-original.pdf', compartilhavel: false });
  });

  it('devolve o uri original quando gravar o arquivo falha', async () => {
    (Print.printToFileAsync as jest.Mock).mockResolvedValue({ uri: 'file:///cache/print-original.pdf', base64: 'QUJD' });
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (LegacyFS.writeAsStringAsync as jest.Mock).mockRejectedValue(new Error('sem permissão'));

    const resultado = await gerarPdfProntuario(preProntuario);

    expect(resultado).toEqual({ uri: 'file:///cache/print-original.pdf', compartilhavel: true });
  });
});

describe('imprimirProntuario', () => {
  it('chama o diálogo de impressão do sistema com o HTML montado', async () => {
    (Print.printAsync as jest.Mock).mockResolvedValue(undefined);

    await imprimirProntuario(preProntuario);

    expect(Print.printAsync).toHaveBeenCalledWith(expect.objectContaining({ html: expect.any(String) }));
  });
});

describe('compartilharPdf', () => {
  it('abre o menu nativo de compartilhamento com o mimeType de PDF', async () => {
    (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

    await compartilharPdf('file:///documentos/arquivo.pdf');

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///documentos/arquivo.pdf', {
      mimeType: 'application/pdf',
      dialogTitle: 'Pré-prontuário',
      UTI: 'com.adobe.pdf',
    });
  });
});
