import { agruparEpisodios, historicoParaDocumento, queixaDoEpisodio, recorrenciaDoEpisodio } from '../episodios';
import type { InteracaoHistorico, ItemRecorrencia, Triagem } from '@domain/entities/Triagem';

const AGORA = Date.parse('2026-09-30T12:00:00Z');
const H = 60 * 60 * 1000;

const triagem: Triagem = {
  nivel: 2,
  resumo: 'r',
  recomendacao: 'rec',
  primeirosSocorros: '',
  unidadeRecomendada: 'UBS',
  sintomas: ['dor_de_cabeca'],
};

const relato = (id: string, horasAtras: number, over: Partial<InteracaoHistorico> = {}): InteracaoHistorico => ({
  id,
  quando: new Date(AGORA - horasAtras * H).toISOString(),
  descricao: `relato ${id}`,
  triagem,
  sintomas: [],
  episodioId: null,
  rotulo: 'dor de cabeça',
  recorrencia: [],
  ...over,
});

const item = (over: Partial<ItemRecorrencia>): ItemRecorrencia => ({
  rotulo: 'dor de cabeça',
  episodios: 3,
  ultimos30Dias: 2,
  ultimoEm: new Date(AGORA - 5 * 24 * H).toISOString(),
  nivelMax: 3,
  ...over,
});

describe('agruparEpisodios', () => {
  it('relatos que não apontam para outro são episódios próprios', () => {
    const eps = agruparEpisodios([relato('a', 1), relato('b', 5)]);
    expect(eps.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('o rótulo é o do relato mais recente que tiver um; o nível é o da última triagem', () => {
    const [ep] = agruparEpisodios([relato('b', 1, { episodioId: 'a', rotulo: null }), relato('a', 3)]);
    expect(ep.rotulo).toBe('dor de cabeça');
    expect(ep.ultimaTriagem?.id).toBe('b');
  });
});

describe('queixaDoEpisodio', () => {
  it('um relato fica como está', () => {
    expect(queixaDoEpisodio(agruparEpisodios([relato('a', 1)])[0])).toBe('relato a');
  });
});

describe('recorrenciaDoEpisodio', () => {
  it('num episódio novo, mostra a conta como veio da Edge Function', () => {
    const [ep] = agruparEpisodios([relato('a', 1, { recorrencia: [item({})] })]);
    expect(recorrenciaDoEpisodio(ep)[0].episodios).toBe(3);
  });

  it('numa continuação, desconta o próprio episódio, que já entrou na conta', () => {
    const [ep] = agruparEpisodios([
      relato('b', 1, { episodioId: 'a', recorrencia: [item({ episodios: 1, ultimos30Dias: 1 })] }),
      relato('a', 3),
    ]);
    // A única "recorrência" era o início deste mesmo episódio.
    expect(recorrenciaDoEpisodio(ep)).toEqual([]);
  });

  it('de outras queixas, só mostra o que se repete', () => {
    const [ep] = agruparEpisodios([
      relato('a', 1, {
        recorrencia: [item({ rotulo: 'tontura', episodios: 1 }), item({ rotulo: 'dor no joelho', episodios: 2 })],
      }),
    ]);
    expect(recorrenciaDoEpisodio(ep).map((i) => i.rotulo)).toEqual(['dor no joelho']);
  });
});

describe('historicoParaDocumento', () => {
  it('separa o escolhido das outras queixas dos últimos 30 dias e escreve a recorrência', () => {
    const eps = agruparEpisodios([
      relato('a', 1, { recorrencia: [item({})] }),
      relato('j', 26, { rotulo: 'dor no joelho', triagem: { ...triagem, nivel: 1 } }),
      relato('velho', 24 * 40, { rotulo: 'tosse' }),
    ]);

    const h = historicoParaDocumento(eps, eps[0], AGORA);

    expect(h.outrasQueixas).toEqual([expect.stringMatching(/ — dor no joelho \(não urgente\)$/)]);
    expect(h.recorrencia).toEqual([
      expect.stringMatching(
        /^dor de cabeça: 3 episódios anteriores em 6 meses \(2 nos últimos 30 dias\), o último em \d\d\/\d\d$/,
      ),
    ]);
  });

  it('sem episódio escolhido, não há recorrência a mostrar', () => {
    const eps = agruparEpisodios([relato('a', 1, { recorrencia: [item({})] })]);
    expect(historicoParaDocumento(eps, null, AGORA).recorrencia).toEqual([]);
  });
});
