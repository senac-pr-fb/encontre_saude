import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CamposObrigatorios } from '../CamposObrigatorios';
import { FORMULARIO_VAZIO } from '@domain/usecases/prontuario';

const iniciais = { ...FORMULARIO_VAZIO, nome: 'Maria Souza', telefone: '46999998888' };

describe('CamposObrigatorios', () => {
  it('mostra só o que falta', async () => {
    await render(<CamposObrigatorios faltantes={['cpf']} valoresIniciais={iniciais} onSalvar={jest.fn()} salvando={false} />);

    expect(screen.getByText('Falta um dado')).toBeTruthy();
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Como está no documento')).toBeNull();
    expect(screen.queryByPlaceholderText('(46) 99999-9999')).toBeNull();
    expect(screen.queryByText('Sexo biológico')).toBeNull();
  });

  it('valida antes de salvar', async () => {
    const onSalvar = jest.fn();
    await render(<CamposObrigatorios faltantes={['cpf']} valoresIniciais={iniciais} onSalvar={onSalvar} salvando={false} />);

    await fireEvent.changeText(screen.getByPlaceholderText('000.000.000-00'), '123');
    await fireEvent.press(screen.getByText('Salvar e continuar'));

    expect(await screen.findByText('O CPF precisa ter 11 dígitos')).toBeTruthy();
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('entrega só os campos que faltavam', async () => {
    const onSalvar = jest.fn();
    await render(
      <CamposObrigatorios faltantes={['cpf', 'sexo']} valoresIniciais={iniciais} onSalvar={onSalvar} salvando={false} />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText('000.000.000-00'), '12345678901');
    await fireEvent.press(screen.getByText('Feminino'));
    await fireEvent.press(screen.getByText('Salvar e continuar'));

    await waitFor(() => expect(onSalvar).toHaveBeenCalledWith({ cpf: '123.456.789-01', sexo: 'Feminino' }));
  });

  it('sem sexo na ficha, exige escolher (não assume o padrão)', async () => {
    const onSalvar = jest.fn();
    await render(<CamposObrigatorios faltantes={['sexo']} valoresIniciais={iniciais} onSalvar={onSalvar} salvando={false} />);

    await fireEvent.press(screen.getByText('Salvar e continuar'));

    expect(await screen.findByText('Selecione o sexo biológico')).toBeTruthy();
    expect(onSalvar).not.toHaveBeenCalled();
  });
});
