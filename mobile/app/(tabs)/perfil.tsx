import { Body, Button, ErrorMessage, Screen, Subtitle, Title } from '@presentation/components/ui';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useAuthActions } from '@presentation/hooks/useAuthActions';

// Ficha de saúde entra no passo 7. Por enquanto: identificação + logout.
export default function PerfilScreen() {
  const { usuario } = useAuth();
  const { signOut } = useAuthActions();

  return (
    <Screen>
      <Title>Meu Perfil</Title>
      {usuario?.nome ? <Body>{usuario.nome}</Body> : null}
      <Subtitle>{usuario?.email}</Subtitle>

      <ErrorMessage message={signOut.error?.message} />
      <Button title="Sair" variant="danger" onPress={() => signOut.mutate()} loading={signOut.isPending} />
    </Screen>
  );
}
