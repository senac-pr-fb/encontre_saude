import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type MapView from 'react-native-maps';
import type { Farmacia } from '@domain/entities/Farmacia';
import { Body, Button, ErrorMessage, Subtitle, Title } from '@presentation/components/ui';
import { FarmaciaCard } from '@presentation/components/features/farmacias/FarmaciaCard';
import { FarmaciasMap } from '@presentation/components/features/farmacias/FarmaciasMap';
import { FiltrosFarmacias } from '@presentation/components/features/farmacias/FiltrosFarmacias';
import { useFarmacias } from '@presentation/hooks/useFarmacias';
import { colors, spacing } from '@presentation/theme';

export default function FarmaciasScreen() {
  const { visiveis, todas, bairros, filtro, setTermo, setBairro, alternarTipo, carregando, erro, recarregar } =
    useFarmacias();
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const mapa = useRef<MapView>(null);
  const lista = useRef<FlatList<Farmacia>>(null);

  // Clique no card centraliza o mapa; clique no marcador rola até o card.
  const focarNoMapa = (f: Farmacia) => {
    setSelecionada(f.id);
    mapa.current?.animateToRegion(
      { latitude: f.lat, longitude: f.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 },
      400,
    );
  };

  const focarNaLista = (id: string) => {
    setSelecionada(id);
    const indice = visiveis.findIndex((f) => f.id === id);
    if (indice >= 0) lista.current?.scrollToIndex({ index: indice, viewPosition: 0.3, animated: true });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        ref={lista}
        data={visiveis}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={
          <View style={styles.cabecalho}>
            <Title>Farmácias</Title>
            <Subtitle>
              {carregando
                ? 'Carregando...'
                : `${visiveis.length} de ${todas.length} ${todas.length === 1 ? 'farmácia' : 'farmácias'}`}
            </Subtitle>

            <FarmaciasMap farmacias={visiveis} selecionada={selecionada} onSelecionar={focarNaLista} />

            <FiltrosFarmacias
              filtro={filtro}
              bairros={bairros}
              onTermo={setTermo}
              onBairro={setBairro}
              onTipo={alternarTipo}
            />

            <ErrorMessage message={erro} />
            {erro ? <Button title="Tentar de novo" variant="secondary" onPress={() => recarregar()} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <FarmaciaCard farmacia={item} selecionada={selecionada === item.id} onPress={() => focarNoMapa(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={
          carregando ? (
            <ActivityIndicator color={colors.greenMedium} style={styles.carregando} />
          ) : erro ? null : (
            <Body>Nenhuma farmácia encontrada com esses filtros.</Body>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  conteudo: { padding: spacing.md, gap: 0 },
  cabecalho: { gap: spacing.md, marginBottom: spacing.md },
  separador: { height: spacing.sm },
  carregando: { marginTop: spacing.xl },
});
