import { StyleSheet, Text, View } from 'react-native';
import { ROTULOS_CAMPOS_OBRIGATORIOS, type ContextoSaude } from '@domain/entities/ContextoSaude';
import { Body, Button, Card } from '@presentation/components/ui';
import { colors, fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  contexto: ContextoSaude;
  onPreTriagem: () => void;
  onManual: () => void;
}

/**
 * Topo do perfil: quanto da ficha está pronto e o caminho recomendado para
 * atualizá-la (a pré-triagem). O pré-prontuário manual fica como alternativa.
 */
export function ResumoFicha({ contexto, onPreTriagem, onManual }: Props) {
  const { completude, faltantes } = contexto;

  const mensagem =
    faltantes.length > 0
      ? `Para gerar o pré-prontuário ainda falta: ${faltantes.map((c) => ROTULOS_CAMPOS_OBRIGATORIOS[c]).join(', ')}.`
      : completude < 100
        ? 'Seus dados obrigatórios estão em dia. Completar o histórico clínico melhora a triagem.'
        : 'Sua ficha está completa.';

  return (
    <Card titulo="Sua ficha de saúde">
      <View style={styles.linha}>
        <View
          style={styles.trilho}
          accessibilityRole="progressbar"
          accessibilityLabel="Ficha preenchida"
          accessibilityValue={{ min: 0, max: 100, now: completude }}
        >
          <View style={[styles.barra, { width: `${completude}%` }]} />
        </View>
        <Text style={styles.percentual}>{completude}%</Text>
      </View>
      <Body style={styles.mensagem}>{mensagem}</Body>

      <Button title="Atualizar pela pré-triagem" onPress={onPreTriagem} />
      <Button title="Pré-prontuário manual" variant="secondary" onPress={onManual} />
    </Card>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trilho: { flex: 1, height: 8, borderRadius: radius.xl, backgroundColor: colors.grayLight, overflow: 'hidden' },
  barra: { height: '100%', borderRadius: radius.xl, backgroundColor: colors.greenMedium },
  percentual: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.greenDark },
  mensagem: { fontSize: fontSizes.sm },
});
