import { StyleSheet, View } from 'react-native';
import { Title } from '@presentation/components/ui';
import { spacing } from '@presentation/theme';
import { BotaoPerfil } from './BotaoPerfil';

/** Título das abas com o acesso ao perfil à direita. */
export function CabecalhoAba({ titulo }: { titulo: string }) {
  return (
    <View style={styles.linha}>
      <Title style={styles.titulo}>{titulo}</Title>
      <BotaoPerfil />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titulo: { flex: 1 },
});
