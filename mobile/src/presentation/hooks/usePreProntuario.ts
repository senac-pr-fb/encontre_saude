import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import type { PreProntuario, TriagemRecente } from '@domain/entities/PreProntuario';
import { FORMULARIO_VAZIO, type ProntuarioFormInput, type ProntuarioFormOutput } from '@domain/usecases/prontuario';
import { compartilharPdf, gerarPdfProntuario, imprimirProntuario } from '@data/pdf/prontuarioPdf';
import { useAuth } from '@presentation/providers/AuthProvider';
import { usePerfil } from './usePerfil';
import { dataParaBR } from '@core/utils/formato';

const txt = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v));

/**
 * Reúne as três automações do site:
 *  1. pré-preenche com a ficha de saúde e o nome da conta;
 *  2. restaura o rascunho salvo no aparelho;
 *  3. traz a última triagem da IA para a queixa principal (validade de 20 min).
 *
 * Ordem de precedência: rascunho > perfil. Quem digitou algo e saiu do app não
 * quer ver o próprio texto substituído pelos dados do cadastro.
 */
export function usePreProntuario() {
  const { usuario } = useAuth();
  // `carregando` importa: enquanto a consulta não volta, `perfil` é um perfil
  // vazio, e montar o formulário com ele deixaria tudo em branco.
  const { perfil, carregando: perfilCarregando } = usePerfil();
  const [iniciais, setIniciais] = useState<ProntuarioFormInput | null>(null);
  const [triagem, setTriagem] = useState<TriagemRecente | null>(null);
  const [rascunhoRestaurado, setRascunhoRestaurado] = useState(false);
  const montado = useRef(false);

  useEffect(() => {
    if (montado.current || !usuario || perfilCarregando) return;
    montado.current = true;

    (async () => {
      const [rascunho, recente] = await Promise.all([
        container.prontuario.rascunho.carregar(),
        container.prontuario.triagemLocal.recente(),
      ]);

      const doPerfil: ProntuarioFormInput = {
        ...FORMULARIO_VAZIO,
        nome: usuario.nome ?? '',
        sexo: perfil?.sexo ?? FORMULARIO_VAZIO.sexo,
        cpf: txt(perfil?.cpf),
        dataNascimento: dataParaBR(perfil?.dataNascimento ?? null),
        telefone: txt(perfil?.telefone),
        peso: txt(perfil?.peso ?? null),
        altura: txt(perfil?.altura ?? null),
        alergias: txt(perfil?.alergias ?? null),
        medicamentosEmUso: txt(perfil?.medicamentosEmUso ?? null),
        doencasPreexistentes: txt(perfil?.doencasPreexistentes ?? null),
        historicoFamiliar: txt(perfil?.historicoFamiliar ?? null),
        pressaoArterial: txt(perfil?.sinaisVitais.pressaoArterial ?? null),
        frequenciaCardiaca: txt(perfil?.sinaisVitais.frequenciaCardiaca ?? null),
        temperatura: txt(perfil?.sinaisVitais.temperatura ?? null),
        saturacaoOxigenio: txt(perfil?.sinaisVitais.saturacaoOxigenio ?? null),
      };

      const base = rascunho ? { ...doPerfil, ...rascunho } : doPerfil;

      // A queixa só é preenchida pela triagem se o usuário ainda não escreveu nada.
      if (recente && !base.queixaPrincipal.trim()) {
        base.queixaPrincipal =
          `RELATO: ${recente.textoUsuario}\n\n` +
          `ANÁLISE DA IA (nível ${recente.nivel}): ${recente.resumo}\n` +
          `RECOMENDAÇÃO: ${recente.recomendacao}`;
      }

      setTriagem(recente);
      setRascunhoRestaurado(rascunho !== null);
      setIniciais(base);
    })();
  }, [usuario, perfil, perfilCarregando]);

  const salvarRascunho = useCallback((valores: ProntuarioFormInput) => {
    container.prontuario.rascunho.salvar(valores);
  }, []);

  const concluir = useMutation({
    mutationFn: async (valores: ProntuarioFormOutput) => {
      const prontuario = valores as PreProntuario;
      await container.prontuario.salvar.execute(usuario!.id, prontuario).then(unwrap);
      const pdf = await gerarPdfProntuario(prontuario);
      await container.prontuario.rascunho.limpar();
      // O prontuario volta junto para permitir reimprimir sem refazer o formulario.
      return { pdf, prontuario };
    },
  });

  return {
    iniciais,
    triagem,
    rascunhoRestaurado,
    salvarRascunho,
    concluir,
    compartilhar: compartilharPdf,
    imprimir: imprimirProntuario,
  };
}
