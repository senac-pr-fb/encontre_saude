import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { EMERGENCIAS } from '@domain/entities/Conteudo';
import { colors, fonts, fontSizes, radius, shadows, spacing } from '@presentation/theme';

/** Atalhos de ligação — o site só cita os números no texto corrido. */
export function Emergencias() {
  return (
    <View style={styles.faixa}>
      {EMERGENCIAS.map((e) => {
        const numero = 'rotulo' in e ? e.rotulo : e.numero;
        return (
          <Pressable
            key={e.numero}
            accessibilityRole="button"
            accessibilityLabel={`Ligar para ${e.nome}, ${numero}`}
            style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
            onPress={() => Linking.openURL(`tel:${e.numero}`)}
          >
            <View style={styles.icone}>
              <FontAwesome6 name={e.icone} size={16} color={colors.white} />
            </View>
            <Text style={styles.nome} numberOfLines={1} adjustsFontSizeToFit>
              {e.nome}
            </Text>
            <View style={styles.ligar}>
              <FontAwesome6 name="phone" size={10} color={colors.white} />
              <Text style={styles.numero} numberOfLines={1} adjustsFontSizeToFit>
                {numero}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: { flexDirection: 'row', gap: spacing.sm },
  botao: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md - spacing.xs,
    borderRadius: radius.md,
    ...shadows.md,
    shadowColor: colors.error,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pressionado: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  icone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.white, opacity: 0.95 },
  ligar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, maxWidth: '100%' },
  numero: { flexShrink: 1, fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.white },
});
