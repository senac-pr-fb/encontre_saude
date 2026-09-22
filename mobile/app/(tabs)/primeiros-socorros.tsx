import { StyleSheet, Text } from 'react-native';
import { Screen } from '@presentation/components/ui';
import { colors, fonts, fontSizes } from '@presentation/theme';

// Placeholder — implementar no passo 9 do guia (docs/guia-construcao-mobile.md).
export default function PrimeirosSocorrosScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Primeiros Socorros</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.greenDark },
});
