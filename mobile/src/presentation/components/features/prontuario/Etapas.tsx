import { StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { ICONES_ETAPAS, TITULOS_ETAPAS } from '@domain/usecases/prontuario';
import { colors, fonts, spacing } from '@presentation/theme';

/** Trilha de progresso das 4 etapas, como a barra do site. */
export function Etapas({ atual }: { atual: number }) {
  return (
    <View style={styles.trilha}>
      {TITULOS_ETAPAS.map((titulo, i) => {
        const numero = i + 1;
        const feito = numero < atual;
        const ativo = numero === atual;
        return (
          <View key={titulo} style={styles.etapa}>
            {i > 0 ? <View style={[styles.linha, feito || ativo ? styles.linhaFeita : null]} /> : null}
            <View style={[styles.bola, feito && styles.bolaFeita, ativo && styles.bolaAtiva]}>
              <FontAwesome6
                name={feito ? 'check' : ICONES_ETAPAS[i]}
                size={12}
                color={feito || ativo ? colors.white : colors.grayMedium}
              />
            </View>
            <Text style={[styles.rotulo, ativo && styles.rotuloAtivo]} numberOfLines={1}>
              {titulo}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  trilha: { flexDirection: 'row', alignItems: 'flex-start' },
  etapa: { flex: 1, alignItems: 'center', gap: spacing.xs },
  linha: { position: 'absolute', top: 15, right: '50%', left: '-50%', height: 2, backgroundColor: colors.grayLight },
  linhaFeita: { backgroundColor: colors.greenMedium },
  bola: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolaFeita: { backgroundColor: colors.greenLight },
  bolaAtiva: { backgroundColor: colors.greenMedium },
  rotulo: { fontFamily: fonts.regular, fontSize: 10, color: colors.textLight, textAlign: 'center' },
  rotuloAtivo: { fontFamily: fonts.semibold, color: colors.greenDark },
});
