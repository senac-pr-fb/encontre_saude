import { StyleSheet, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Body } from '@presentation/components/ui';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

/** Faixa informativa do pré-prontuário (ex.: rascunho recuperado). */
export function AvisoProntuario({ icone, texto }: { icone: string; texto: string }) {
  return (
    <View style={styles.aviso}>
      <FontAwesome6 name={icone} size={13} color={colors.greenDark} />
      <Body style={styles.texto}>{texto}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.greenAccent,
    padding: spacing.sm,
    borderRadius: 8,
  },
  texto: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.greenDark },
});
