import { SINTOMAS, type ColunaSintoma, type HistoricoRecenteDocumento } from '@domain/entities/PreProntuario';
import { NIVEIS, type InteracaoHistorico, type ItemRecorrencia } from '@domain/entities/Triagem';
import {
  JANELA_OUTRAS_QUEIXAS_MS,
  type Episodio,
  type TriagemDoHistorico,
} from '@domain/entities/ContextoSaude';
import { dataHoraCurta } from '@core/utils/formato';

const temTriagem = (i: InteracaoHistorico): i is TriagemDoHistorico => i.triagem !== null;

/**
 * Agrupa o histórico em episódios: cada relato aponta para o primeiro do seu
 * episódio (`episodioId`), ou é ele mesmo o primeiro. Mais recente primeiro.
 */
export function agruparEpisodios(historico: InteracaoHistorico[]): Episodio[] {
  const porId = new Map<string, InteracaoHistorico[]>();
  for (const i of historico) {
    const chave = i.episodioId ?? i.id;
    porId.set(chave, [...(porId.get(chave) ?? []), i]);
  }

  const episodios = [...porId].map(([id, itens]): Episodio => {
    const entradas = [...itens].sort((a, b) => Date.parse(a.quando) - Date.parse(b.quando));
    const comTriagem = entradas.filter(temTriagem);
    const sintomas = new Set<ColunaSintoma>();
    for (const e of entradas) for (const s of e.triagem?.sintomas ?? e.sintomas) sintomas.add(s);
    return {
      id,
      entradas,
      ultimaTriagem: comTriagem[comTriagem.length - 1] ?? null,
      inicio: entradas[0].quando,
      fim: entradas[entradas.length - 1].quando,
      rotulo: [...entradas].reverse().find((e) => e.rotulo)?.rotulo ?? null,
      // Na ordem do formulário, como o resto do app mostra.
      sintomas: SINTOMAS.map((s) => s.coluna).filter((c) => sintomas.has(c)),
    };
  });

  return episodios.sort((a, b) => Date.parse(b.fim) - Date.parse(a.fim));
}

/** Queixa do documento: um relato fica como está; vários viram linha do tempo. */
export function queixaDoEpisodio(episodio: Episodio): string {
  if (episodio.entradas.length === 1) return episodio.entradas[0].descricao;
  return episodio.entradas.map((e) => `${dataHoraCurta(e.quando)}: ${e.descricao}`).join('\n\n');
}

const rotulosDoEpisodio = (e: Episodio) =>
  new Set(
    [e.rotulo, ...e.sintomas.map((c) => SINTOMAS.find((s) => s.coluna === c)?.rotulo ?? c)]
      .filter((r): r is string => !!r)
      .map((r) => r.toLowerCase()),
  );

/**
 * Recorrência a mostrar para o episódio. A conta da Edge Function é "antes
 * deste relato": num episódio com relatos anteriores, ele mesmo já entrou na
 * conta e é descontado aqui.
 */
export function recorrenciaDoEpisodio(episodio: Episodio): ItemRecorrencia[] {
  const itens = episodio.ultimaTriagem?.recorrencia ?? [];
  const proprios = rotulosDoEpisodio(episodio);
  const jaContado = episodio.entradas.length > 1;

  return itens
    .map((i) =>
      jaContado && proprios.has(i.rotulo.toLowerCase())
        ? { ...i, episodios: i.episodios - 1, ultimos30Dias: Math.max(0, i.ultimos30Dias - 1) }
        : i,
    )
    .filter((i) => i.episodios > 0)
    // Da mesma queixa, qualquer registro conta; de outras, só o que se repete.
    .filter((i) => proprios.has(i.rotulo.toLowerCase()) || i.episodios >= 2);
}

const textoRecorrencia = (i: ItemRecorrencia) =>
  `${i.rotulo}: ${i.episodios} ${i.episodios === 1 ? 'episódio anterior' : 'episódios anteriores'} em 6 meses` +
  (i.ultimos30Dias > 0 ? ` (${i.ultimos30Dias} nos últimos 30 dias)` : '') +
  (i.ultimoEm ? `, o último em ${dataHoraCurta(i.ultimoEm).slice(0, 5)}` : '');

/** O que o PDF leva além da queixa: outras queixas recentes e recorrência. */
export function historicoParaDocumento(
  episodios: Episodio[],
  escolhido: Episodio | null,
  agora: number = Date.now(),
): HistoricoRecenteDocumento {
  const outrasQueixas = episodios
    .filter((e) => e.id !== escolhido?.id && agora - Date.parse(e.fim) <= JANELA_OUTRAS_QUEIXAS_MS)
    .slice(0, 3)
    .map((e) => {
      const nivel = e.ultimaTriagem?.triagem.nivel;
      const oQue = e.rotulo ?? e.entradas[e.entradas.length - 1].descricao.slice(0, 60);
      return `${dataHoraCurta(e.fim)} — ${oQue}${nivel ? ` (${NIVEIS[nivel].texto.toLowerCase()})` : ''}`;
    });

  return {
    outrasQueixas,
    recorrencia: escolhido ? recorrenciaDoEpisodio(escolhido).slice(0, 5).map(textoRecorrencia) : [],
  };
}
