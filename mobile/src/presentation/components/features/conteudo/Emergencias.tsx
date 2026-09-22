import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { EMERGENCIAS } from '@domain/entities/Conteudo';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

/** Atalhos de ligação — o site só cita os números no texto corrido. */
export function Emergencias() {
  return (
    <View style={styles.faixa}>
      {EMERGENCIAS.map((e) => (
        <Pressable key={e.numero} style={styles.botao} onPress={() => Linking.openURL(`tel:${e.numero}`)}>
          <FontAwesome6 name={e.icone} size={16} color={colors.white} />
          <View>
            <Text style={styles.nome}>{e.nome}</Text>
            <Text style={styles.numero}>{'rotulo' in e ? e.rotulo : e.numero}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  nome: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.white, opacity: 0.9 },
  numero: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.white },
});
