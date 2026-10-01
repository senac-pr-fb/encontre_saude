import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import type { ComplementoTriagem } from '@domain/entities/Triagem';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useHistorico } from './useHistorico';

export function useTriagem() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const userId = usuario?.id;
  const historico = useHistorico();

  const analisar = useMutation({
    mutationFn: ({ descricao, complemento }: { descricao: string; complemento?: ComplementoTriagem }) =>
      container.triagem.realizar.execute(descricao, complemento).then(unwrap),
    // A própria Edge Function grava no histórico, então basta recarregá-lo.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['historico', userId] }),
  });

  // "Não é isso": o relato sai do episódio; o contexto de saúde se recalcula com o histórico.
  const desvincular = useMutation({
    mutationFn: (historicoId: string) => container.triagem.desvincular.execute(historicoId).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['historico', userId] }),
  });

  return {
    analisar,
    desvincular,
    historico: historico.data ?? [],
    carregandoHistorico: historico.isLoading,
    erroHistorico: historico.error?.message ?? null,
  };
}
