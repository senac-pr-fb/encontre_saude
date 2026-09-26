import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Screen } from '../Screen';

describe('Screen', () => {
  it('renderiza os filhos dentro de uma rolagem por padrão', async () => {
    await render(
      <Screen>
        <Text>conteúdo</Text>
      </Screen>,
    );

    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('renderiza os filhos sem rolagem quando scroll=false', async () => {
    await render(
      <Screen scroll={false}>
        <Text>conteúdo</Text>
      </Screen>,
    );

    expect(screen.getByText('conteúdo')).toBeTruthy();
  });
});
