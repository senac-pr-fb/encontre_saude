import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import type { HistoricoRecenteDocumento, PreProntuario } from '@domain/entities/PreProntuario';
import type { ProntuarioFormOutput } from '@domain/usecases/prontuario';
import { useAuth } from '@presentation/providers/AuthProvider';

/**
 * O único gerador do documento: grava a consulta, sincroniza a ficha, gera o
 * PDF e limpa o rascunho. Tanto o documento montado pelo contexto quanto a
 * edição manual terminam aqui.
 */
export function useConcluirPreProntuario() {
  const { usuario } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      valores,
      historicoRecente,
    }: {
      valores: ProntuarioFormOutput;
      /** Outras queixas e recorrência: vão para o PDF, não para o banco. */
      historicoRecente?: HistoricoRecenteDocumento;
    }) => {
      const prontuario: PreProntuario = { ...(valores as PreProntuario), historicoRecente };
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
}
