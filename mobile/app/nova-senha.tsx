import { useRouter } from 'expo-router';
import { Screen, Title } from '@presentation/components/ui';
import { NovaSenhaForm } from '@presentation/components/features/auth/NovaSenhaForm';
import { useAuthActions } from '@presentation/hooks/useAuthActions';

/**
 * Visita 2 da recuperação de senha. Fica no grupo protegido porque o link do
 * e-mail já restaurou uma sessão (o AuthProvider redireciona para cá ao
 * detectar type=recovery no deep link).
 */
export default function NovaSenhaScreen() {
  const router = useRouter();
  const { atualizarSenha } = useAuthActions();

  return (
    <Screen>
      <Title>Nova senha</Title>
      <NovaSenhaForm
        onSubmit={(input) => atualizarSenha.mutate(input, { onSuccess: () => router.replace('/(tabs)') })}
        carregando={atualizarSenha.isPending}
        erro={atualizarSenha.error?.message}
      />
    </Screen>
  );
}
