import { render, screen, fireEvent } from '@testing-library/react-native';
import { NomeUsuario } from '../NomeUsuario';

describe('NomeUsuario', () => {
  it('mostra o nome e abre a edição com o valor atual', async () => {
    await render(<NomeUsuario nome="Maria Souza" onSalvar={jest.fn()} />);
    expect(screen.getByText('Maria Souza')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Editar nome'));
    expect(screen.getByDisplayValue('Maria Souza')).toBeTruthy();
  });

  it('salva o nome sem espaços nas pontas', async () => {
    const onSalvar = jest.fn();
    await render(<NomeUsuario nome="Maria" onSalvar={onSalvar} />);
    await fireEvent.press(screen.getByLabelText('Editar nome'));
    await fireEvent.changeText(screen.getByDisplayValue('Maria'), '  Maria Souza ');
    await fireEvent.press(screen.getByText('Salvar'));
    expect(onSalvar).toHaveBeenCalledWith('Maria Souza');
  });

  it('não salva nome vazio nem igual ao atual', async () => {
    const onSalvar = jest.fn();
    await render(<NomeUsuario nome="Maria" onSalvar={onSalvar} />);
    await fireEvent.press(screen.getByLabelText('Editar nome'));
    await fireEvent.press(screen.getByText('Salvar'));
    await fireEvent.changeText(screen.getByDisplayValue('Maria'), '   ');
    await fireEvent.press(screen.getByText('Salvar'));
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('cancelar volta ao nome sem salvar', async () => {
    const onSalvar = jest.fn();
    await render(<NomeUsuario nome="Maria" onSalvar={onSalvar} />);
    await fireEvent.press(screen.getByLabelText('Editar nome'));
    await fireEvent.press(screen.getByText('Cancelar'));
    expect(screen.getByText('Maria')).toBeTruthy();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('convida a adicionar quando a conta não tem nome', async () => {
    await render(<NomeUsuario nome={null} onSalvar={jest.fn()} />);
    expect(screen.getByText('Adicionar nome')).toBeTruthy();
  });

  it('fecha a edição quando o salvamento termina', async () => {
    const props = { nome: 'Maria', onSalvar: jest.fn() };
    const { rerender } = await render(<NomeUsuario {...props} />);
    await fireEvent.press(screen.getByLabelText('Editar nome'));
    await rerender(<NomeUsuario {...props} nome="Maria Souza" sucesso />);
    expect(screen.getByText('Maria Souza')).toBeTruthy();
    expect(screen.queryByText('Salvar')).toBeNull();
  });
});
