import { useMemo } from 'react';
import { montarContexto } from '@domain/usecases/contexto';
import { useAuth } from '@presentation/providers/AuthProvider';
import { usePerfil } from './usePerfil';
import { useHistorico } from './useHistorico';

/**
 * Contexto de saúde global: ficha + histórico, lidos do cache do React Query.
 * Não há estado próprio — salvar o perfil, fazer uma triagem ou gerar um
 * documento atualiza as queries, e o contexto se recalcula sozinho.
 */
export function useContextoSaude() {
  const { usuario } = useAuth();
  const { perfil, existe, carregando: carregandoPerfil, erroCarregar } = usePerfil();
  const historico = useHistorico();
  const carregando = carregandoPerfil || historico.isLoading;

  // Enquanto carrega, `perfil` é um perfil vazio: montar com ele diria que
  // falta tudo. Melhor não responder nada ainda.
  const contexto = useMemo(
    () =>
      carregando || !perfil
        ? null
        : montarContexto({
            perfil,
            fichaExiste: existe,
            nome: usuario?.nome ?? null,
            historico: historico.data ?? [],
          }),
    [carregando, perfil, existe, usuario?.nome, historico.data],
  );

  return {
    contexto,
    carregando,
    erro: erroCarregar ?? historico.error?.message ?? null,
  };
}
