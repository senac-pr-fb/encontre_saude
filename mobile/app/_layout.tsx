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
import { colors } from '@presentation/theme';

SplashScreen.preventAutoHideAsync();

// REGRA: login obrigatório. Diferente do site, o app não tem área pública.
// No passo 6 o AuthProvider entra aqui e `logado` passa a vir de useAuth();
// até lá, o guard fica aberto para permitir navegar pelo esqueleto.
const logado = true;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={logado}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="pre-prontuario"
            options={{ presentation: 'modal', headerShown: true, title: 'Pré-prontuário' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!logado}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </QueryProvider>
  );
}
