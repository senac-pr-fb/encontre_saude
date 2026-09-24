import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { CENTRO_FRANCISCO_BELTRAO, type Farmacia } from '@domain/entities/Farmacia';
import { colors, radius } from '@presentation/theme';

export const REGIAO_INICIAL: Region = {
  latitude: CENTRO_FRANCISCO_BELTRAO.lat,
  longitude: CENTRO_FRANCISCO_BELTRAO.lng,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

interface Props {
  farmacias: Farmacia[];
  selecionada: string | null;
  onSelecionar: (id: string) => void;
}

/** Substitui o mapa Leaflet do site. Municipais em verde, privadas em vermelho. */
export const FarmaciasMap = forwardRef<MapView, Props>(function FarmaciasMap(
  { farmacias, selecionada, onSelecionar },
  ref,
) {
  return (
    // O arredondamento fica no contêiner, não no MapView: no Android, aplicar
    // borderRadius + overflow hidden na própria superfície do mapa faz ela
    // renderizar preta, com só a marca d'água do Google por cima.
    <View style={styles.moldura}>
      <MapView ref={ref} provider={PROVIDER_DEFAULT} style={styles.mapa} initialRegion={REGIAO_INICIAL}>
        {farmacias.map((f) => (
          <Marker
            key={f.id}
            coordinate={{ latitude: f.lat, longitude: f.lng }}
            title={f.nome}
            description={f.endereco ?? f.bairro}
            pinColor={f.tipo === 'Municipal' ? colors.greenMedium : colors.error}
            opacity={selecionada === null || selecionada === f.id ? 1 : 0.6}
            onPress={() => onSelecionar(f.id)}
          />
        ))}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  moldura: {
    height: 280,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.grayLight,
  },
  mapa: { flex: 1 },
});
