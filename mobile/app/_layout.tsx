import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { QueryProvider } from '@presentation/providers/QueryProvider';
import { AuthProvider, useAuth } from '@presentation/providers/AuthProvider';
import { useProtecaoAlternadorApps } from '@presentation/hooks/useTelaProtegida';
import { colors, fonts } from '@presentation/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootStack />
      </AuthProvider>
    </QueryProvider>
  );
}

// REGRA: login obrigatório. Diferente do site, o app não tem área pública.
// Único gate de rotas: sem sessão só (auth) existe; com sessão, (auth) some.
// Sessão aberta pelo link de recuperação só enxerga a nova senha até trocá-la.
function RootStack() {
  const { usuario, carregando, recuperandoSenha } = useAuth();
  const logado = usuario !== null;
  useProtecaoAlternadorApps();

  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync();
  }, [carregando]);

  if (carregando) return null; // splash continua visível

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.greenDark,
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerShadowVisible: false,
      }}
    >
      <Stack.Protected guard={logado && !recuperandoSenha}>
        <Stack.Screen name="(tabs)" />
        {/* Destino do botão do meio da navbar. */}
        <Stack.Screen name="documento" options={{ presentation: 'modal', headerShown: true, title: 'Pré-prontuário' }} />
        {/* Fora das abas: abre pelo avatar do canto superior direito. */}
        <Stack.Screen name="perfil" options={{ headerShown: true, title: 'Meu perfil' }} />
      </Stack.Protected>
      <Stack.Protected guard={logado && recuperandoSenha}>
        <Stack.Screen name="nova-senha" options={{ headerShown: true, title: 'Nova senha' }} />
      </Stack.Protected>
      <Stack.Protected guard={!logado}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
