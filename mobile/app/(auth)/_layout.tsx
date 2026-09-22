import { Stack } from 'expo-router';
import { colors, fonts } from '@presentation/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.greenDark,
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Entrar' }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      <Stack.Screen name="recuperar-senha" options={{ title: 'Recuperar senha' }} />
    </Stack>
  );
}
