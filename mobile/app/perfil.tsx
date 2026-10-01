import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, ErrorMessage, Screen, Subtitle } from '@presentation/components/ui';
import { PerfilForm } from '@presentation/components/features/perfil/PerfilForm';
import { ResumoFicha } from '@presentation/components/features/perfil/ResumoFicha';
import { useAuth } from '@presentation/providers/AuthProvider';
import { useAuthActions } from '@presentation/hooks/useAuthActions';
import { usePerfil } from '@presentation/hooks/usePerfil';
import { useContextoSaude } from '@presentation/hooks/useContextoSaude';
import { useTelaProtegida } from '@presentation/hooks/useTelaProtegida';
import { perfilParaFormulario } from '@domain/usecases/perfil';
import { colors, fonts, fontSizes, spacing } from '@presentation/theme';

/**
 * Prioriza a pré-triagem: o resumo da ficha e o atalho para ela vêm primeiro;
 * o pré-prontuário manual e a edição direta da ficha ficam como alternativas.
 */
export default function PerfilScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { signOut } = useAuthActions();
  const { perfil, carregando, erroCarregar, salvar } = usePerfil();
  const { contexto } = useContextoSaude();
  useTelaProtegida('perfil');

  return (
    <Screen>
      {usuario?.nome ? <Body>{usuario.nome}</Body> : null}
      <Subtitle>{usuario?.email}</Subtitle>

      <ErrorMessage message={erroCarregar} />

      {carregando || !perfil ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.greenMedium} />
        </View>
      ) : (
        <>
          {contexto ? (
            <ResumoFicha
              contexto={contexto}
              // A pré-triagem é a Home: fecha o perfil em vez de empilhar outra tela.
              onPreTriagem={() => router.dismissTo('/')}
              onManual={() => router.push({ pathname: '/documento', params: { modo: 'editar' } })}
            />
          ) : null}

          <Subtitle style={styles.secao}>Minha ficha de saúde</Subtitle>
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
  secao: { fontFamily: fonts.semibold, fontSize: fontSizes.lg, color: colors.greenDark, marginTop: spacing.sm },
});
