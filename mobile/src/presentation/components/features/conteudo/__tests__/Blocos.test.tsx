import { render, screen } from '@testing-library/react-native';
import { Blocos } from '../Blocos';
import type { BlocoConteudo } from '@domain/entities/Conteudo';

describe('Blocos', () => {
  it('renderiza subtítulos, parágrafos e listas', async () => {
    const blocos: BlocoConteudo[] = [
      { tipo: 'subtitulo', texto: 'Sinais de alerta' },
      { tipo: 'paragrafo', texto: 'Texto comum' },
      { tipo: 'paragrafo', texto: 'Texto em destaque', destaque: true },
      { tipo: 'lista', itens: ['Item 1', 'Item 2'] },
    ];

    await render(<Blocos blocos={blocos} />);

    expect(screen.getByText('Sinais de alerta')).toBeTruthy();
    expect(screen.getByText('Texto comum')).toBeTruthy();
    expect(screen.getByText('Texto em destaque')).toBeTruthy();
    expect(screen.getByText('Item 1')).toBeTruthy();
    expect(screen.getByText('Item 2')).toBeTruthy();
  });

  it('renderiza uma lista vazia sem quebrar', async () => {
    const { toJSON } = await render(<Blocos blocos={[]} />);
    expect(toJSON()).toBeTruthy();
  });
});
