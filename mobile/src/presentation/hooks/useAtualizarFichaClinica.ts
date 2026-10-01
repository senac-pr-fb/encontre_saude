import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import type { PerfilSaude } from '@domain/entities/PerfilSaude';
import type { AtualizacoesFicha } from '@domain/entities/Triagem';
import { useAuth } from '@presentation/providers/AuthProvider';

/** Grava na ficha o que o paciente confirmou depois da pré-triagem. */
export function useAtualizarFichaClinica() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const userId = usuario?.id;

  return useMutation({
    mutationFn: (dados: Partial<AtualizacoesFicha>) =>
      container.perfil.atualizarFichaClinica.execute(userId!, dados).then(unwrap),
    onSuccess: (perfil: PerfilSaude) => qc.setQueryData(['perfil', userId], perfil),
  });
}
