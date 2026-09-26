import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('renderiza o título quando informado', async () => {
    await render(
      <Card titulo="Dados pessoais">
        <Text>conteúdo</Text>
      </Card>,
    );

    expect(screen.getByText('Dados pessoais')).toBeTruthy();
    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('não renderiza título quando não informado', async () => {
    await render(
      <Card>
        <Text>conteúdo</Text>
      </Card>,
    );

    expect(screen.queryByText('Dados pessoais')).toBeNull();
    expect(screen.getByText('conteúdo')).toBeTruthy();
  });
});
