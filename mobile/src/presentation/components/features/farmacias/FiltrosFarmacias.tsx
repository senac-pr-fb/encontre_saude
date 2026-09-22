import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { TIPOS_FARMACIA, type TipoFarmacia } from '@domain/entities/Farmacia';
import type { FiltroFarmacias } from '@domain/usecases/farmacias';
import { Input } from '@presentation/components/ui';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  filtro: FiltroFarmacias;
  bairros: string[];
  onTermo: (v: string) => void;
  onBairro: (v: string | null) => void;
  onTipo: (t: TipoFarmacia) => void;
}

export function FiltrosFarmacias({ filtro, bairros, onTermo, onBairro, onTipo }: Props) {
  return (
    <View style={styles.bloco}>
      <Input
        label="Buscar"
        placeholder="Nome ou bairro"
        value={filtro.termo}
        onChangeText={onTermo}
        autoCorrect={false}
      />

      <View style={styles.tipos}>
        {TIPOS_FARMACIA.map((t) => {
          const ativo = filtro.tipos.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() => onTipo(t)}
              style={[styles.tipo, ativo && styles.tipoAtivo]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ativo }}
            >
              <FontAwesome6
                name={ativo ? 'square-check' : 'square'}
                size={14}
                color={ativo ? colors.greenDark : colors.grayMedium}
              />
              <Text style={[styles.tipoTexto, ativo && styles.tipoTextoAtivo]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bairros derivados das farmácias cadastradas, não de uma lista fixa */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bairros}>
        <Chip rotulo="Todos" ativo={filtro.bairro === null} onPress={() => onBairro(null)} />
        {bairros.map((b) => (
          <Chip key={b} rotulo={b} ativo={filtro.bairro === b} onPress={() => onBairro(b)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({ rotulo, ativo, onPress }: { rotulo: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: spacing.sm },
  tipos: { flexDirection: 'row', gap: spacing.md },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tipoAtivo: {},
  tipoTexto: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  tipoTextoAtivo: { fontFamily: fonts.medium, color: colors.greenDark },
  bairros: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  chipAtivo: { backgroundColor: colors.greenMedium, borderColor: colors.greenMedium },
  chipTexto: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  chipTextoAtivo: { fontFamily: fonts.semibold, color: colors.white },
});
