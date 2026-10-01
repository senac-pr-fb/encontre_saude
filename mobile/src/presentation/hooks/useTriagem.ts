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

  return {
    analisar,
    historico: historico.data ?? [],
    carregandoHistorico: historico.isLoading,
    erroHistorico: historico.error?.message ?? null,
  };
}
