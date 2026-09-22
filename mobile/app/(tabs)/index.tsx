import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { Button, Screen } from '@presentation/components/ui';
import { colors, fonts, fontSizes } from '@presentation/theme';

// Home: triagem de sintomas (passo 11). Por enquanto valida tema, fonte e navegação.
export default function HomeScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Encontre Saúde</Text>
      <Text style={styles.subtitle}>Descreva seus sintomas e receba uma orientação inicial.</Text>
      <Button title="Analisar sintomas" onPress={() => {}} />
      <Link href="/(auth)/login" asChild>
        <Button title="Entrar" variant="secondary" />
      </Link>
      <Link href="/pre-prontuario" asChild>
        <Button title="Pré-prontuário" variant="ghost" />
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xxl, color: colors.greenDark },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textLight },
});
