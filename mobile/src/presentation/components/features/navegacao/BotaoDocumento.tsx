import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, fonts, shadows } from '@presentation/theme';

/**
 * Botão central da navbar, maior que as abas. Não é uma aba: abre a tela do
 * documento por cima, sem trocar a aba em que o usuário está.
 */
export function BotaoDocumento({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.slot}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Gerar pré-prontuário"
        style={({ pressed }) => [styles.circulo, pressed && styles.pressionado]}
      >
        <FontAwesome6 name="file-medical" size={24} color={colors.white} />
      </Pressable>
      <Text style={styles.rotulo} numberOfLines={1}>
        Pré-prontuário
      </Text>
    </View>
  );
}

const TAMANHO = 60;

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center' },
  circulo: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: TAMANHO / 2,
    // Metade do botão fica acima da barra.
    marginTop: -TAMANHO / 3,
    backgroundColor: colors.greenDark,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  pressionado: { backgroundColor: colors.btnActive },
  rotulo: { fontFamily: fonts.medium, fontSize: 11, color: colors.greenDark, marginTop: 2 },
});
