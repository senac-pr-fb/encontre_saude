import { useRouter } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import { Screen, Subtitle, Title } from '@presentation/components/ui';
import { LoginForm } from '@presentation/components/features/auth/LoginForm';
import { useAuthActions } from '@presentation/hooks/useAuthActions';
import { spacing } from '@presentation/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuthActions();

  // Não há navegação explícita no sucesso: o AuthProvider recebe SIGNED_IN
  // e o Stack.Protected do layout raiz troca (auth) por (tabs).
  return (
    <Screen>
      <Image source={require('../../assets/logoTipo.png')} style={styles.logo} resizeMode="contain" />
      <Title>Bem-vindo</Title>
      <Subtitle>Entre para acessar sua ficha de saúde e a triagem de sintomas.</Subtitle>
      <LoginForm
        onSubmit={(input) => signIn.mutate(input)}
        onGoogle={() => signInWithGoogle.mutate()}
        onEsqueceuSenha={() => router.push('/recuperar-senha')}
        onCadastro={() => router.push('/cadastro')}
        carregando={signIn.isPending}
        carregandoGoogle={signInWithGoogle.isPending}
        erro={signIn.error?.message ?? signInWithGoogle.error?.message}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: '100%', height: 72, marginTop: spacing.md },
});
