import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Body, Button, Card, ErrorMessage, Screen, Subtitle, Title } from '@presentation/components/ui';
import { PerfilForm } from '@presentation/components/features/perfil/PerfilForm';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useAuthActions } from '@presentation/hooks/useAuthActions';
import { usePerfil } from '@presentation/hooks/usePerfil';
import { perfilParaFormulario } from '@domain/usecases/perfil';
import { colors, spacing } from '@presentation/theme';

export default function PerfilScreen() {
  const { usuario } = useAuth();
  const { signOut } = useAuthActions();
  const { perfil, existe, carregando, erroCarregar, salvar } = usePerfil();

  return (
    <Screen>
      <Title>Meu Perfil</Title>
      {usuario?.nome ? <Body>{usuario.nome}</Body> : null}
      <Subtitle>{usuario?.email}</Subtitle>

      <ErrorMessage message={erroCarregar} />

      {carregando || !perfil ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.greenMedium} />
        </View>
      ) : (
        <>
          {!existe ? (
            <Card>
              <Body>
                Sua ficha de saúde ainda está vazia. Preencher agora acelera o atendimento e melhora a triagem de
                sintomas.
              </Body>
            </Card>
          ) : null}

          <PerfilForm
            valoresIniciais={perfilParaFormulario(perfil)}
            onSubmit={(valores) => salvar.mutate(valores)}
            salvando={salvar.isPending}
            erro={salvar.error?.message}
            sucesso={salvar.isSuccess}
          />
        </>
      )}

      <ErrorMessage message={signOut.error?.message} />
      <Button title="Sair" variant="danger" onPress={() => signOut.mutate()} loading={signOut.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centro: { paddingVertical: spacing.xl, alignItems: 'center' },
});
