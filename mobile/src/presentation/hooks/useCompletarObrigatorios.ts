import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import type { DadosObrigatorios } from '@domain/usecases/perfil';
import { useAuth } from '@presentation/providers/AuthProvider';

/**
 * Salva só os obrigatórios que faltavam. A ficha nova entra no cache e o
 * contexto de saúde se recalcula; o nome chega pelo evento USER_UPDATED do AuthProvider.
 */
export function useCompletarObrigatorios() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const userId = usuario?.id;

  return useMutation({
    mutationFn: (entrada: DadosObrigatorios) =>
      container.perfil.completarObrigatorios.execute(userId!, entrada).then(unwrap),
    onSuccess: (perfil: PerfilSaude) => qc.setQueryData(['perfil', userId], perfil),
  });
}
