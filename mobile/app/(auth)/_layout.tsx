import { Stack } from 'expo-router';
import { colors, fonts } from '@presentation/theme';

// Login é a tela inicial do grupo; cadastro e recuperação empilham sobre ela.
export const unstable_settings = { initialRouteName: 'login' };

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.greenDark,
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      <Stack.Screen name="recuperar-senha" options={{ title: 'Recuperar senha' }} />
    </Stack>
  );
}
