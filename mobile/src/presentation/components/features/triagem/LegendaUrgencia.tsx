import { StyleSheet, Text, View } from 'react-native';
import { NIVEIS, NIVEIS_ORDENADOS } from '@domain/entities/Triagem';
import { Acordeao } from '@presentation/components/features/conteudo/Acordeao';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

/**
 * Os 5 niveis com cor e significado — no site ficam sempre visiveis num painel
 * lateral; no celular nao cabe, entao viram um acordeao fechado por padrao.
 */
export function LegendaUrgencia() {
  return (
    <Acordeao titulo="Níveis de urgência" icone="circle-info">
      {NIVEIS_ORDENADOS.map((n) => (
        <View key={n} style={styles.item}>
          <View style={[styles.bola, { backgroundColor: NIVEIS[n].cor }]} />
          <View style={styles.textos}>
            <Text style={styles.nome}>
              {n}. {NIVEIS[n].texto}
            </Text>
            <Text style={styles.descricao}>{NIVEIS[n].conduta}</Text>
          </View>
        </View>
      ))}
    </Acordeao>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bola: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  textos: { flex: 1, gap: 1 },
  nome: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.text },
  descricao: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textLight, lineHeight: 17 },
});
