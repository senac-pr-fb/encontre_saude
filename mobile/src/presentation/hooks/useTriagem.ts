import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import { useAuth } from '@presentation/providers/AuthProvider';

export function useTriagem() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const userId = usuario?.id;

  const historico = useQuery({
    queryKey: ['historico', userId],
    queryFn: () => container.triagem.historico.execute(userId!).then(unwrap),
    enabled: !!userId,
  });

  const analisar = useMutation({
    mutationFn: (descricao: string) => container.triagem.realizar.execute(descricao).then(unwrap),
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
