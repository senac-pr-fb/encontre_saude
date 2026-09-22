import { StyleSheet, Text, View } from 'react-native';
import type { BlocoConteudo } from '@domain/entities/Conteudo';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

/** Renderiza os blocos estruturados que substituíram o HTML do site. */
export function Blocos({ blocos }: { blocos: BlocoConteudo[] }) {
  return (
    <View style={styles.grupo}>
      {blocos.map((bloco, i) => {
        if (bloco.tipo === 'subtitulo') {
          return (
            <Text key={i} style={styles.subtitulo}>
              {bloco.texto}
            </Text>
          );
        }
        if (bloco.tipo === 'paragrafo') {
          return (
            <Text key={i} style={[styles.paragrafo, bloco.destaque && styles.destaque]}>
              {bloco.texto}
            </Text>
          );
        }
        return (
          <View key={i} style={styles.lista}>
            {bloco.itens.map((item, j) => (
              <View key={j} style={styles.item}>
                <Text style={styles.marcador}>•</Text>
                <Text style={styles.itemTexto}>{item}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: spacing.sm },
  subtitulo: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.greenDark,
    marginTop: spacing.xs,
  },
  paragrafo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 21 },
  destaque: { fontFamily: fonts.medium, color: colors.greenDark },
  lista: { gap: spacing.xs },
  item: { flexDirection: 'row', gap: spacing.sm },
  marcador: { fontFamily: fonts.bold, fontSize: fontSizes.sm, color: colors.greenMedium, lineHeight: 21 },
  itemTexto: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.text, lineHeight: 21 },
});
