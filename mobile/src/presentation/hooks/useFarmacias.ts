import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import { bairrosDe, filtrarFarmacias, FILTRO_INICIAL, type FiltroFarmacias } from '@domain/usecases/farmacias';
import type { TipoFarmacia } from '@domain/entities/Farmacia';

/**
 * As farmacias mudam raramente: uma consulta por sessao basta.
 * O filtro e local (53 registros), entao nao ha ida ao servidor a cada tecla.
 */
export function useFarmacias() {
  const [filtro, setFiltro] = useState<FiltroFarmacias>(FILTRO_INICIAL);

  const query = useQuery({
    queryKey: ['farmacias'],
    queryFn: () => container.farmacias.listar.execute().then(unwrap),
    staleTime: 60 * 60 * 1000,
  });

  const todas = useMemo(() => query.data ?? [], [query.data]);
  const bairros = useMemo(() => bairrosDe(todas), [todas]);
  const visiveis = useMemo(() => filtrarFarmacias(todas, filtro), [todas, filtro]);

  return {
    todas,
    visiveis,
    bairros,
    filtro,
    setTermo: (termo: string) => setFiltro((f) => ({ ...f, termo })),
    setBairro: (bairro: string | null) => setFiltro((f) => ({ ...f, bairro })),
    alternarTipo: (tipo: TipoFarmacia) =>
      setFiltro((f) => ({
        ...f,
        tipos: f.tipos.includes(tipo) ? f.tipos.filter((t) => t !== tipo) : [...f.tipos, tipo],
      })),
    carregando: query.isLoading,
    erro: query.error?.message ?? null,
    recarregar: query.refetch,
  };
}
