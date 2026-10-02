import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useContextoSaude } from '@presentation/hooks/useContextoSaude';
import { colors } from '@presentation/theme';

/**
 * Avatar do canto superior direito: a foto da conta Google quando houver, senão
 * o ícone de usuário. O ponto de aviso aparece enquanto a ficha não tem os
 * dados que o documento exige.
 */
export function BotaoPerfil() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { contexto } = useContextoSaude();
  const pendente = (contexto?.faltantes.length ?? 0) > 0;
  const [fotoFalhou, setFotoFalhou] = useState(false);
  const foto = fotoFalhou ? null : usuario?.foto;

  return (
    <Pressable
      onPress={() => router.push('/perfil')}
      accessibilityRole="button"
      accessibilityLabel={pendente ? 'Abrir perfil. Há dados da ficha para completar' : 'Abrir perfil'}
      hitSlop={8}
      style={({ pressed }) => [styles.avatar, pressed && styles.pressionado]}
    >
      {foto ? (
        <Image source={{ uri: foto }} style={styles.foto} onError={() => setFotoFalhou(true)} testID="perfil-foto" />
      ) : (
        <FontAwesome6 name="user" size={16} color={colors.greenDark} testID="perfil-icone" />
      )}
      {pendente ? <View style={styles.aviso} testID="perfil-pendente" /> : null}
    </Pressable>
  );
}

const TAMANHO = 40;

const styles = StyleSheet.create({
  avatar: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: TAMANHO / 2,
    backgroundColor: colors.greenAccent,
    borderWidth: 1,
    borderColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: { opacity: 0.7 },
  foto: { width: '100%', height: '100%', borderRadius: TAMANHO / 2 },
  aviso: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
