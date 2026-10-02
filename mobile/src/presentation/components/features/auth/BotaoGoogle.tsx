import { ActivityIndicator, Image, Pressable, StyleSheet, Text } from 'react-native';
import { fonts, fontSizes, radius, spacing } from '@presentation/theme';

interface Props {
  onPress: () => void;
  carregando?: boolean;
  desabilitado?: boolean;
}

// Cores da diretriz de marca do Google (botão claro): fundo branco, borda e texto neutros.
const GOOGLE = { fundo: '#FFFFFF', borda: '#747775', texto: '#1F1F1F' } as const;

/**
 * Botão no padrão do Google em vez das cores do app: o verde-claro se
 * camuflava na tela de login e parte dos usuários não o percebia.
 */
export function BotaoGoogle({ onPress, carregando, desabilitado }: Props) {
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel="Continuar com o Google"
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado, inativo && styles.inativo]}
    >
      {carregando ? (
        <ActivityIndicator color={GOOGLE.texto} />
      ) : (
        <>
          <Image source={require('../../../../../assets/google-g.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.texto}>Continuar com o Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md - spacing.xs,
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: GOOGLE.fundo,
    borderWidth: 1,
    borderColor: GOOGLE.borda,
  },
  pressionado: { backgroundColor: '#F2F2F2' },
  inativo: { opacity: 0.6 },
  logo: { width: 20, height: 20 },
  texto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: GOOGLE.texto },
});
