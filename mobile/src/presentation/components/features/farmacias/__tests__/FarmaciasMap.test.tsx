import { render, screen, fireEvent } from '@testing-library/react-native';
import { FarmaciasMap, REGIAO_INICIAL } from '../FarmaciasMap';
import type { Farmacia } from '@domain/entities/Farmacia';

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = React.forwardRef(function MapView(props: object, ref: unknown) {
    return React.createElement(View, { ...props, ref, testID: 'map-view' });
  });
  function Marker(props: { testID?: string }) {
    return React.createElement(View, { ...props, testID: props.testID ?? 'map-marker' });
  }
  return { __esModule: true, default: MapView, Marker, PROVIDER_DEFAULT: 'default' };
});

const farmacia = (overrides: Partial<Farmacia>): Farmacia => ({
  id: '1',
  nome: 'Farmácia Central',
  endereco: null,
  bairro: 'Centro',
  telefone: null,
  horario: null,
  site: null,
  instagram: null,
  tipo: 'Municipal',
  lat: -26.08,
  lng: -53.05,
  ...overrides,
});

describe('FarmaciasMap', () => {
  it('renderiza um marcador para cada farmácia', async () => {
    const farmacias = [farmacia({ id: '1' }), farmacia({ id: '2', tipo: 'Privada' })];
    await render(<FarmaciasMap farmacias={farmacias} selecionada={null} onSelecionar={jest.fn()} />);

    expect(screen.getAllByTestId('map-marker')).toHaveLength(2);
  });

  it('chama onSelecionar com o id da farmácia ao pressionar o marcador', async () => {
    const onSelecionar = jest.fn();
    const farmacias = [farmacia({ id: '1' })];
    await render(<FarmaciasMap farmacias={farmacias} selecionada={null} onSelecionar={onSelecionar} />);

    await fireEvent.press(screen.getByTestId('map-marker'));

    expect(onSelecionar).toHaveBeenCalledWith('1');
  });

  it('usa a região inicial centrada em Francisco Beltrão', () => {
    expect(REGIAO_INICIAL.latitude).toBeCloseTo(-26.0815);
    expect(REGIAO_INICIAL.longitude).toBeCloseTo(-53.0556);
  });
});
