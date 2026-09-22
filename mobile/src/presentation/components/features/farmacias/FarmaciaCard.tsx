import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import type { Farmacia } from '@domain/entities/Farmacia';
import { soDigitos } from '@core/utils/formato';
import { colors, fonts, fontSizes, radius, shadows, spacing } from '@presentation/theme';

interface Props {
  farmacia: Farmacia;
  selecionada: boolean;
  onPress: () => void;
}

export function FarmaciaCard({ farmacia: f, selecionada, onPress }: Props) {
  const abrirRota = () =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`);

  return (
    <Pressable onPress={onPress} style={[styles.card, selecionada && styles.selecionada]}>
      <View style={styles.cabecalho}>
        <Text style={styles.nome}>{f.nome}</Text>
        <View style={[styles.selo, f.tipo === 'Municipal' ? styles.seloMunicipal : styles.seloPrivada]}>
          <Text style={[styles.seloTexto, f.tipo === 'Municipal' && styles.seloTextoMunicipal]}>{f.tipo}</Text>
        </View>
      </View>

      {f.endereco ? <Linha icone="location-dot" texto={f.endereco} /> : null}
      <Linha icone="map-pin" texto={f.bairro} />
      {f.horario ? <Linha icone="clock" texto={f.horario} /> : null}

      <View style={styles.acoes}>
        {f.telefone ? (
          <Acao
            icone="phone"
            rotulo={f.telefone}
            onPress={() => Linking.openURL(`tel:${soDigitos(f.telefone!)}`)}
          />
        ) : null}
        {f.site ? <Acao icone="globe" rotulo="Site" onPress={() => Linking.openURL(f.site!)} /> : null}
        {f.instagram ? (
          <Acao icone="instagram" rotulo="Instagram" onPress={() => Linking.openURL(f.instagram!)} />
        ) : null}
        <Acao icone="diamond-turn-right" rotulo="Ver rota" onPress={abrirRota} destaque />
      </View>
    </Pressable>
  );
}

function Linha({ icone, texto }: { icone: string; texto: string }) {
  return (
    <View style={styles.linha}>
      <FontAwesome6 name={icone} size={12} color={colors.textLight} style={styles.linhaIcone} />
      <Text style={styles.linhaTexto}>{texto}</Text>
    </View>
  );
}

function Acao({
  icone,
  rotulo,
  onPress,
  destaque,
}: {
  icone: string;
  rotulo: string;
  onPress: () => void;
  destaque?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.acao, destaque && styles.acaoDestaque]} hitSlop={4}>
      <FontAwesome6 name={icone} size={12} color={destaque ? colors.white : colors.greenDark} />
      <Text style={[styles.acaoTexto, destaque && styles.acaoTextoDestaque]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  selecionada: { borderColor: colors.greenMedium },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  nome: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.greenDark },
  selo: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  seloMunicipal: { backgroundColor: colors.greenAccent },
  seloPrivada: { backgroundColor: colors.grayLight },
  seloTexto: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.textLight },
  seloTextoMunicipal: { color: colors.greenDark },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  linhaIcone: { marginTop: 3, width: 14 },
  linhaTexto: { flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.greenAccent,
  },
  acaoDestaque: { backgroundColor: colors.greenMedium },
  acaoTexto: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.greenDark },
  acaoTextoDestaque: { color: colors.white },
});
