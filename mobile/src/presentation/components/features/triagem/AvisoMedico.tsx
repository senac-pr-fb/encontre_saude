import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

/** Mesmo aviso do site, com o 192 discavel. */
export function AvisoMedico() {
  return (
    <View style={styles.caixa}>
      <FontAwesome6 name="triangle-exclamation" size={14} color={colors.error} />
      <Text style={styles.texto}>
        Esta é uma triagem preliminar por inteligência artificial e{' '}
        <Text style={styles.forte}>não substitui uma consulta médica</Text>. Em emergência, ligue para{' '}
        <Text style={styles.link} onPress={() => Linking.openURL('tel:192')}>
          192
        </Text>{' '}
        ou procure o hospital mais próximo.
      </Text>
    </View>
  );
}

/** Atalho de ligacao quando a IA classifica como emergencia. */
export function ChamarSamu() {
  return (
    <Pressable style={styles.samu} onPress={() => Linking.openURL('tel:192')}>
      <FontAwesome6 name="phone-volume" size={16} color={colors.white} />
      <Text style={styles.samuTexto}>Ligar para o SAMU (192)</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#FFF0F0',
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  texto: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.text, lineHeight: 18 },
  forte: { fontFamily: fonts.semibold },
  link: { fontFamily: fonts.bold, color: colors.error },
  samu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  samuTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.white },
});
