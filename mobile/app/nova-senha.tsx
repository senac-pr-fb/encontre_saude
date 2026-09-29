import { Button, ErrorMessage, Screen, Title } from '@presentation/components/ui';
import { NovaSenhaForm } from '@presentation/components/features/auth/NovaSenhaForm';
import { useAuthActions } from '@presentation/hooks/useAuthActions';
import { useTelaProtegida } from '@presentation/hooks/useTelaProtegida';
import { useAuth } from '@presentation/providers/AuthProvider';

/**
 * Visita 2 da recuperação de senha. Só existe enquanto a sessão veio do link do
 * e-mail (o AuthProvider marca isso ao consumir o deep link); fora da
 * recuperação a rota nem é registrada. Não há navegação explícita no sucesso:
 * encerrar a recuperação troca o guard do layout raiz e o app vai para (tabs).
 */
export default function NovaSenhaScreen() {
  const { atualizarSenha, signOut } = useAuthActions();
  const { encerrarRecuperacao } = useAuth();
  useTelaProtegida('nova-senha');

  return (
    <Screen>
      <Title>Nova senha</Title>
      <NovaSenhaForm
        onSubmit={(input) => atualizarSenha.mutate(input, { onSuccess: encerrarRecuperacao })}
        carregando={atualizarSenha.isPending}
        erro={atualizarSenha.error?.message}
      />
      {/* Sem esta saída, quem desistisse de trocar a senha ficaria preso aqui. */}
      <ErrorMessage message={signOut.error?.message} />
      <Button
        title="Cancelar e sair"
        variant="ghost"
        onPress={() => signOut.mutate()}
        loading={signOut.isPending}
        disabled={atualizarSenha.isPending}
      />
    </Screen>
  );
}
