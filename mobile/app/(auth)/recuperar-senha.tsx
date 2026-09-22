import { useRouter } from 'expo-router';
import { Screen, Title } from '@presentation/components/ui';
import { RecuperarSenhaForm } from '@presentation/components/features/auth/RecuperarSenhaForm';
import { useAuthActions } from '@presentation/hooks/useAuthActions';

export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const { recuperarSenha } = useAuthActions();

  return (
    <Screen>
      <Title>Recuperar senha</Title>
      <RecuperarSenhaForm
        onSubmit={(input) => recuperarSenha.mutate(input)}
        onVoltar={() => router.replace('/login')}
        carregando={recuperarSenha.isPending}
        enviado={recuperarSenha.isSuccess}
        erro={recuperarSenha.error?.message}
      />
    </Screen>
  );
}
