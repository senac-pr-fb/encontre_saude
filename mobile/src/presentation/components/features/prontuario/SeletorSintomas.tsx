import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { SINTOMAS, type ColunaSintoma } from '@domain/entities/PreProntuario';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  selecionados: ColunaSintoma[];
  onChange: (v: ColunaSintoma[]) => void;
}

/** Os 12 checkboxes do site, como cartões tocáveis. */
export function SeletorSintomas({ selecionados, onChange }: Props) {
  const alternar = (coluna: ColunaSintoma) =>
    onChange(
      selecionados.includes(coluna) ? selecionados.filter((s) => s !== coluna) : [...selecionados, coluna],
    );

  return (
    <View style={styles.grade}>
      {SINTOMAS.map((s) => {
        const ativo = selecionados.includes(s.coluna);
        return (
          <Pressable
            key={s.coluna}
            onPress={() => alternar(s.coluna)}
            style={[styles.item, ativo && styles.itemAtivo]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ativo }}
          >
            <FontAwesome6 name={s.icone} size={14} color={ativo ? colors.greenDark : colors.grayMedium} />
            <Text style={[styles.texto, ativo && styles.textoAtivo]}>{s.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  itemAtivo: { backgroundColor: colors.greenAccent, borderColor: colors.greenMedium },
  texto: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  textoAtivo: { fontFamily: fonts.semibold, color: colors.greenDark },
});
