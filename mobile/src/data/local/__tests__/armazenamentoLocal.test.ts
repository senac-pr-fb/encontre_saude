import AsyncStorage from '@react-native-async-storage/async-storage';
import { criarRascunho, triagemLocal, CHAVE_RASCUNHO_PRONTUARIO } from '../armazenamentoLocal';
import { VALIDADE_TRIAGEM_MS } from '@domain/entities/PreProntuario';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('CHAVE_RASCUNHO_PRONTUARIO', () => {
  it('tem o valor esperado', () => {
    expect(CHAVE_RASCUNHO_PRONTUARIO).toBe('rascunhoPreProntuario');
  });
});

describe('criarRascunho', () => {
  interface Rascunho {
    nome: string;
  }

  it('devolve null quando não há nada salvo', async () => {
    const rascunho = criarRascunho<Rascunho>('chave-teste');
    expect(await rascunho.carregar()).toBeNull();
  });

  it('salva, carrega e limpa o valor', async () => {
    const rascunho = criarRascunho<Rascunho>('chave-teste');

    await rascunho.salvar({ nome: 'João' });
    expect(await rascunho.carregar()).toEqual({ nome: 'João' });

    await rascunho.limpar();
    expect(await rascunho.carregar()).toBeNull();
  });

  it('devolve null quando o storage está indisponível ao ler', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('indisponível'));
    const rascunho = criarRascunho<Rascunho>('chave-teste');

    expect(await rascunho.carregar()).toBeNull();
  });

  it('não lança quando o storage falha ao salvar', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('sem espaço'));
    const rascunho = criarRascunho<Rascunho>('chave-teste');

    await expect(rascunho.salvar({ nome: 'João' })).resolves.toBeUndefined();
  });

  it('não lança quando o storage falha ao limpar', async () => {
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('falha'));
    const rascunho = criarRascunho<Rascunho>('chave-teste');

    await expect(rascunho.limpar()).resolves.toBeUndefined();
  });
});

describe('triagemLocal', () => {
  it('devolve null quando nunca houve registro', async () => {
    expect(await triagemLocal.recente()).toBeNull();
  });

  it('devolve a triagem registrada dentro da validade', async () => {
    await triagemLocal.registrar({ textoUsuario: 'febre', nivel: 3, resumo: 'r', recomendacao: 'rec' });

    const recente = await triagemLocal.recente();

    expect(recente).toEqual(expect.objectContaining({ textoUsuario: 'febre', nivel: 3 }));
  });

  it('devolve null quando a última triagem já expirou', async () => {
    const agora = Date.now();
    jest.spyOn(Date, 'now').mockReturnValueOnce(agora - VALIDADE_TRIAGEM_MS - 1000);
    await triagemLocal.registrar({ textoUsuario: 'febre', nivel: 3, resumo: 'r', recomendacao: 'rec' });
    jest.spyOn(Date, 'now').mockReturnValueOnce(agora);

    expect(await triagemLocal.recente()).toBeNull();
  });
});
