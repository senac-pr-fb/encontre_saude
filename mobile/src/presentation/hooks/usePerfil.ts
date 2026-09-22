import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { PerfilFormInput } from '@domain/usecases/perfil';
import { useAuth } from '@presentation/providers/AuthProvider';

export function usePerfil() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const userId = usuario?.id;

  const query = useQuery({
    queryKey: ['perfil', userId],
    queryFn: () => container.perfil.get.execute(userId!).then(unwrap),
    enabled: !!userId,
  });

  const salvar = useMutation({
    mutationFn: (entrada: PerfilFormInput) => container.perfil.save.execute(userId!, entrada).then(unwrap),
    onSuccess: (perfil: PerfilSaude) => qc.setQueryData(['perfil', userId], perfil),
  });

  return {
    /** Ficha salva, ou um perfil vazio enquanto o usuario nao preencheu. */
    perfil: query.data ?? (userId ? perfilVazio(userId) : null),
    existe: query.data != null,
    carregando: query.isLoading,
    erroCarregar: query.error?.message ?? null,
    recarregar: query.refetch,
    salvar,
  };
}
