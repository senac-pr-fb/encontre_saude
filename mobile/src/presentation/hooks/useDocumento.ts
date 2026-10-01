import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from '@core/di/container';
import {
  contextoParaFormulario,
  etapaDados,
  mesclarRascunho,
  prontuarioSchema,
  type ProntuarioFormInput,
  type ProntuarioFormOutput,
} from '@domain/usecases/prontuario';
import { historicoParaDocumento } from '@domain/usecases/contexto';
import { useContextoSaude } from './useContextoSaude';
import { useConcluirPreProntuario } from './useConcluirPreProntuario';
import { useCompletarObrigatorios } from './useCompletarObrigatorios';

/**
 * Tela do botão do meio. O documento sai direto do contexto de saúde; a edição
 * manual é opcional e parte dos mesmos dados (com o rascunho por cima, se houver).
 */
export function useDocumento() {
  const { contexto, carregando, erro } = useContextoSaude();
  const concluir = useConcluirPreProntuario();
  const completar = useCompletarObrigatorios();
  // undefined enquanto o AsyncStorage não respondeu.
  const [rascunho, setRascunho] = useState<ProntuarioFormInput | null | undefined>(undefined);
  const [episodioEscolhido, setEpisodioEscolhido] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    container.prontuario.rascunho.carregar().then((r) => {
      if (ativo) setRascunho(r);
    });
    return () => {
      ativo = false;
    };
  }, []);

  /**
   * O episódio que vira a queixa: o escolhido entre os ativos ou, por padrão, o
   * mais recente. Vencido não vira queixa: o que a pessoa sente já pode ser outra coisa.
   */
  const episodio = useMemo(() => {
    if (!contexto) return null;
    const escolhido = contexto.episodiosAtivos.find((e) => e.id === episodioEscolhido);
    if (escolhido) return escolhido;
    return contexto.triagemValida ? contexto.episodioAtual : null;
  }, [contexto, episodioEscolhido]);

  const historicoRecente = useMemo(
    () => (contexto ? historicoParaDocumento(contexto.episodios, episodio) : undefined),
    [contexto, episodio],
  );

  const doContexto = useMemo(
    () => (contexto ? contextoParaFormulario(contexto.perfil, contexto.nome, episodio) : null),
    [contexto, episodio],
  );

  const iniciaisEdicao = useMemo(
    () => (doContexto && rascunho !== undefined ? mesclarRascunho(doContexto, rascunho) : null),
    [doContexto, rascunho],
  );
  // Com os dados pessoais válidos, a edição manual começa nos sintomas.
  const dadosPessoaisOk = useMemo(() => !!iniciaisEdicao && etapaDados.safeParse(iniciaisEdicao).success, [iniciaisEdicao]);

  /**
   * Gera sem passar pelo formulário. Devolve false se algum dado da ficha não
   * passa na validação (ex.: sinal vital fora da faixa) — a tela então abre a
   * edição, onde o erro aparece no campo.
   */
  const gerarDoContexto = useCallback(() => {
    const valido = doContexto ? prontuarioSchema.safeParse(doContexto) : null;
    if (!valido?.success) return false;
    concluir.mutate({ valores: valido.data, historicoRecente });
    return true;
  }, [doContexto, concluir, historicoRecente]);

  const concluirEdicao = useCallback(
    (valores: ProntuarioFormOutput) => concluir.mutate({ valores, historicoRecente }),
    [concluir, historicoRecente],
  );

  const salvarRascunho = useCallback((valores: ProntuarioFormInput) => {
    container.prontuario.rascunho.salvar(valores);
  }, []);

  return {
    contexto,
    carregando: carregando || rascunho === undefined,
    erro,
    episodio,
    escolherEpisodio: setEpisodioEscolhido,
    historicoRecente,
    iniciaisEdicao,
    rascunhoRestaurado: !!rascunho,
    dadosPessoaisOk,
    gerarDoContexto,
    concluirEdicao,
    salvarRascunho,
    concluir,
    completar,
    compartilhar: container.prontuario.pdf.compartilhar,
    imprimir: container.prontuario.pdf.imprimir,
  };
}
