import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Button, ErrorMessage, Input } from '@presentation/components/ui';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

interface Props {
  nome: string | null;
  onSalvar: (nome: string) => void;
  salvando?: boolean;
  erro?: string;
  /** Vira true quando o salvamento termina; fecha a edição. */
  sucesso?: boolean;
}

/**
 * Nome da conta no topo do perfil, com edição no lugar. O nome novo volta
 * pelo evento USER_UPDATED do AuthProvider.
 */
export function NomeUsuario({ nome, onSalvar, salvando, erro, sucesso }: Props) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nome ?? '');

  // Fecha a edição quando o salvamento termina. Ajuste durante o render (padrão
  // do React para "estado que muda com uma prop"), em vez de setState num effect.
  const [sucessoAnterior, setSucessoAnterior] = useState(sucesso);
  if (sucesso !== sucessoAnterior) {
    setSucessoAnterior(sucesso);
    if (sucesso) setEditando(false);
  }

  const limpo = valor.trim();

  if (!editando) {
    return (
      <Pressable
        onPress={() => {
          setValor(nome ?? '');
          setEditando(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Editar nome"
        hitSlop={8}
        style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}
      >
        <Text style={[styles.nome, !nome && styles.vazio]}>{nome ?? 'Adicionar nome'}</Text>
        <FontAwesome6 name="pen" size={12} color={colors.greenMedium} />
      </Pressable>
    );
  }

  return (
    <View style={styles.edicao}>
      <Input
        label="Nome"
        value={valor}
        onChangeText={setValor}
        autoFocus
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={() => limpo && limpo !== nome && onSalvar(limpo)}
      />
      <ErrorMessage message={erro} />
      <View style={styles.acoes}>
        <Button title="Cancelar" variant="ghost" onPress={() => setEditando(false)} style={styles.acao} />
        <Button
          title="Salvar"
          onPress={() => onSalvar(limpo)}
          loading={salvando}
          disabled={!limpo || limpo === nome}
          style={styles.acao}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' },
  pressionado: { opacity: 0.6 },
  nome: { fontFamily: fonts.semibold, fontSize: fontSizes.lg, color: colors.text },
  vazio: { color: colors.greenMedium, fontSize: fontSizes.md },
  edicao: { gap: spacing.sm },
  acoes: { flexDirection: 'row', gap: spacing.sm },
  acao: { flex: 1 },
});
