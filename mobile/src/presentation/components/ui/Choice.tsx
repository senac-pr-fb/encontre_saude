import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

/** Sim/Não — substitui os radios de "fuma" e "bebe" do site. */
export function Toggle({ label, value, onValueChange }: ToggleProps) {
  return (
    <View style={styles.linha}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.grayLight, true: colors.greenLight }}
        thumbColor={value ? colors.greenMedium : colors.white}
      />
    </View>
  );
}

interface OpcoesProps<T extends string> {
  label: string;
  opcoes: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  error?: string;
}

/** Seleção curta em linha — substitui o <select> de sexo. */
export function Opcoes<T extends string>({ label, opcoes, value, onChange, error }: OpcoesProps<T>) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.opcoes}>
        {opcoes.map((op) => {
          const ativo = op === value;
          return (
            <Pressable
              key={op}
              onPress={() => onChange(op)}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo }}
              style={[styles.opcao, ativo && styles.opcaoAtiva]}
            >
              <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtivo]}>{op}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grupo: { gap: spacing.xs },
  label: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.text },
  opcoes: { flexDirection: 'row', gap: spacing.sm },
  opcao: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.grayLight,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  opcaoAtiva: { backgroundColor: colors.greenAccent, borderColor: colors.greenMedium },
  opcaoTexto: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textLight },
  opcaoTextoAtivo: { fontFamily: fonts.semibold, color: colors.greenDark },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.error },
});
