import { Text } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { QueryProvider } from '../QueryProvider';

function Consumidor() {
  const client = useQueryClient();
  return <Text>{client ? 'tem-client' : 'sem-client'}</Text>;
}

describe('QueryProvider', () => {
  it('renderiza os filhos', async () => {
    await render(
      <QueryProvider>
        <Text>conteúdo</Text>
      </QueryProvider>,
    );

    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('disponibiliza um QueryClient para os filhos', async () => {
    await render(
      <QueryProvider>
        <Consumidor />
      </QueryProvider>,
    );

    expect(screen.getByText('tem-client')).toBeTruthy();
  });
});
