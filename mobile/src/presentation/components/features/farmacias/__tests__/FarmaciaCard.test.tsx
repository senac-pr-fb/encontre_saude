import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FarmaciaCard } from '../FarmaciaCard';
import type { Farmacia } from '@domain/entities/Farmacia';

const farmaciaCompleta: Farmacia = {
  id: '1',
  nome: 'Farmácia Central',
  endereco: 'Rua A, 123',
  bairro: 'Centro',
  telefone: '(46) 3520-1234',
  horario: 'Seg a Sex, 8h-18h',
  site: 'https://farmaciacentral.com.br',
  instagram: 'https://instagram.com/farmaciacentral',
  tipo: 'Municipal',
  lat: -26.08,
  lng: -53.05,
};

const farmaciaMinima: Farmacia = {
  id: '2',
  nome: 'Drogaria Popular',
  endereco: null,
  bairro: 'Água Branca',
  telefone: null,
  horario: null,
  site: null,
  instagram: null,
  tipo: 'Privada',
  lat: -26.09,
  lng: -53.06,
};

describe('FarmaciaCard', () => {
  it('renderiza nome, tipo, endereço, bairro e horário quando disponíveis', async () => {
    await render(<FarmaciaCard farmacia={farmaciaCompleta} selecionada={false} onPress={jest.fn()} />);

    expect(screen.getByText('Farmácia Central')).toBeTruthy();
    expect(screen.getByText('Municipal')).toBeTruthy();
    expect(screen.getByText('Rua A, 123')).toBeTruthy();
    expect(screen.getByText('Centro')).toBeTruthy();
    expect(screen.getByText('Seg a Sex, 8h-18h')).toBeTruthy();
  });

  it('omite endereço, horário e ações de contato quando ausentes', async () => {
    await render(<FarmaciaCard farmacia={farmaciaMinima} selecionada={false} onPress={jest.fn()} />);

    expect(screen.getByText('Privada')).toBeTruthy();
    expect(screen.getByText('Água Branca')).toBeTruthy();
    expect(screen.queryByText('Site')).toBeNull();
    expect(screen.queryByText('Instagram')).toBeNull();
    // "Ver rota" está sempre presente, mesmo sem os outros contatos.
    expect(screen.getByText('Ver rota')).toBeTruthy();
  });

  it('chama onPress ao pressionar o card', async () => {
    const onPress = jest.fn();
    await render(<FarmaciaCard farmacia={farmaciaMinima} selecionada={false} onPress={onPress} />);

    await fireEvent.press(screen.getByText('Drogaria Popular'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('liga para o telefone ao pressionar a ação de telefone', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await render(<FarmaciaCard farmacia={farmaciaCompleta} selecionada={false} onPress={jest.fn()} />);
    await fireEvent.press(screen.getByText('(46) 3520-1234'));

    expect(openURL).toHaveBeenCalledWith('tel:4635201234');
    openURL.mockRestore();
  });

  it('abre o site e o instagram nas respectivas ações', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await render(<FarmaciaCard farmacia={farmaciaCompleta} selecionada={false} onPress={jest.fn()} />);
    await fireEvent.press(screen.getByText('Site'));
    await fireEvent.press(screen.getByText('Instagram'));

    expect(openURL).toHaveBeenCalledWith('https://farmaciacentral.com.br');
    expect(openURL).toHaveBeenCalledWith('https://instagram.com/farmaciacentral');
    openURL.mockRestore();
  });

  it('abre a rota no Google Maps com as coordenadas da farmácia', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

    await render(<FarmaciaCard farmacia={farmaciaCompleta} selecionada={false} onPress={jest.fn()} />);
    await fireEvent.press(screen.getByText('Ver rota'));

    expect(openURL).toHaveBeenCalledWith('https://www.google.com/maps/dir/?api=1&destination=-26.08,-53.05');
    openURL.mockRestore();
  });
});
