import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import type { PreProntuario, TriagemRecente } from '@domain/entities/PreProntuario';
import {
  contextoParaFormulario,
  type ProntuarioFormInput,
  type ProntuarioFormOutput,
} from '@domain/usecases/prontuario';
import { useAuth } from '@presentation/providers/AuthProvider';
import { usePerfil } from './usePerfil';

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
  const qc = useQueryClient();
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

      const doPerfil = contextoParaFormulario(perfil, usuario.nome);

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

      // O nome não tem coluna em `dados_saude`: ele pertence à conta. Quem se
      // cadastrou por e-mail não tem nome nenhum (só o login Google traz um),
      // então guardamos o que foi digitado para não perguntar de novo.
      if (prontuario.nome && prontuario.nome !== usuario!.nome) {
        await container.auth.repo.atualizarNome(prontuario.nome);
      }

      const pdf = await container.prontuario.pdf.gerar(prontuario);
      await container.prontuario.rascunho.limpar();
      // O prontuario volta junto para permitir reimprimir sem refazer o formulario.
      return { pdf, prontuario };
    },
    // A consulta entrou no histórico e a ficha foi sincronizada: o contexto de saúde se recalcula.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perfil', usuario?.id] });
      qc.invalidateQueries({ queryKey: ['historico', usuario?.id] });
    },
  });

  return {
    iniciais,
    triagem,
    rascunhoRestaurado,
    salvarRascunho,
    concluir,
    compartilhar: container.prontuario.pdf.compartilhar,
    imprimir: container.prontuario.pdf.imprimir,
  };
}
