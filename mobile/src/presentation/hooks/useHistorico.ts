import { useQuery } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import { useAuth } from '@presentation/providers/AuthProvider';

/** Histórico de triagens e pré-prontuários. Uma query só, lida pela Home e pelo contexto de saúde. */
export function useHistorico() {
  const { usuario } = useAuth();
  const userId = usuario?.id;

  return useQuery({
    queryKey: ['historico', userId],
    queryFn: () => container.triagem.historico.execute(userId!).then(unwrap),
    enabled: !!userId,
  });
}
