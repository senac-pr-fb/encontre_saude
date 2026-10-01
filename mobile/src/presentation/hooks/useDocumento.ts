import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from '@core/di/container';
import {
  contextoParaFormulario,
  etapaDados,
  mesclarRascunho,
  prontuarioSchema,
  type ProntuarioFormInput,
} from '@domain/usecases/prontuario';
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

  useEffect(() => {
    let ativo = true;
    container.prontuario.rascunho.carregar().then((r) => {
      if (ativo) setRascunho(r);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const doContexto = useMemo(
    () =>
      contexto
        ? contextoParaFormulario(
            contexto.perfil,
            contexto.nome,
            // Triagem vencida não vira queixa: o que a pessoa sente já pode ser outra coisa.
            contexto.triagemValida ? contexto.ultimaTriagem : null,
          )
        : null,
    [contexto],
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
    concluir.mutate(valido.data);
    return true;
  }, [doContexto, concluir]);

  const salvarRascunho = useCallback((valores: ProntuarioFormInput) => {
    container.prontuario.rascunho.salvar(valores);
  }, []);

  return {
    contexto,
    carregando: carregando || rascunho === undefined,
    erro,
    iniciaisEdicao,
    rascunhoRestaurado: !!rascunho,
    dadosPessoaisOk,
    gerarDoContexto,
    salvarRascunho,
    concluir,
    completar,
    compartilhar: container.prontuario.pdf.compartilhar,
    imprimir: container.prontuario.pdf.imprimir,
  };
}
