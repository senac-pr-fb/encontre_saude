import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Acordeao } from '../Acordeao';

describe('Acordeao', () => {
  it('inicia fechado, sem mostrar o conteúdo', async () => {
    await render(
      <Acordeao titulo="Engasgo">
        <Text>Conteúdo do tópico</Text>
      </Acordeao>,
    );

    expect(screen.getByText('Engasgo')).toBeTruthy();
    expect(screen.queryByText('Conteúdo do tópico')).toBeNull();
    expect(screen.getByRole('button').props.accessibilityState).toEqual(expect.objectContaining({ expanded: false }));
  });

  it('abre e mostra o conteúdo ao pressionar o cabeçalho, e fecha ao pressionar de novo', async () => {
    await render(
      <Acordeao titulo="Engasgo">
        <Text>Conteúdo do tópico</Text>
      </Acordeao>,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(screen.getByText('Conteúdo do tópico')).toBeTruthy();
    expect(screen.getByRole('button').props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));

    await fireEvent.press(screen.getByRole('button'));
    expect(screen.queryByText('Conteúdo do tópico')).toBeNull();
  });
});
