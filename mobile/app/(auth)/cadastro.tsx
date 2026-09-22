import { useRouter } from 'expo-router';
import { Screen, Subtitle, SuccessMessage, TextLink, Title } from '@presentation/components/ui';
import { CadastroForm } from '@presentation/components/features/auth/CadastroForm';
import { useAuthActions } from '@presentation/hooks/useAuthActions';

export default function CadastroScreen() {
  const router = useRouter();
  const { signUp } = useAuthActions();

  // Com confirmação de e-mail ligada no Supabase, o cadastro não cria sessão:
  // mostra a instrução e deixa o usuário voltar ao login depois de confirmar.
  if (signUp.isSuccess && signUp.data.precisaConfirmarEmail) {
    return (
      <Screen>
        <Title>Quase lá</Title>
        <SuccessMessage message={`Enviamos um link de confirmação para ${signUp.data.usuario.email}. Confirme e depois entre com sua senha.`} />
        <TextLink onPress={() => router.replace('/login')}>Ir para o login</TextLink>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Criar conta</Title>
      <Subtitle>Sua ficha de saúde fica disponível no site e no app com a mesma conta.</Subtitle>
      <CadastroForm
        onSubmit={(input) => signUp.mutate(input)}
        onLogin={() => router.back()}
        carregando={signUp.isPending}
        erro={signUp.error?.message}
      />
    </Screen>
  );
}
