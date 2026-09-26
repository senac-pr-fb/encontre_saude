import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PerfilForm } from '../PerfilForm';
import type { PerfilFormInput } from '@domain/usecases/perfil';

const valoresVazios: PerfilFormInput = {
  idade: '',
  peso: '',
  altura: '',
  sexo: null,
  cpf: '',
  dataNascimento: '',
  telefone: '',
  fuma: false,
  bebe: false,
  alergias: '',
  alergiaMedicamento: '',
  medicamentosEmUso: '',
  doencasPreexistentes: '',
  historicoFamiliar: '',
  possuiDeficiencia: '',
  contatoMedico: { nome: '', email: '', telefone: '' },
  sinaisVitais: { pressaoArterial: '', frequenciaCardiaca: '', temperatura: '', saturacaoOxigenio: '' },
  observacoes: '',
};

function propsPadrao(overrides: Partial<React.ComponentProps<typeof PerfilForm>> = {}) {
  return { valoresIniciais: valoresVazios, onSubmit: jest.fn(), salvando: false, ...overrides };
}

describe('PerfilForm', () => {
  it('renderiza os valores iniciais nos campos', async () => {
    const valores: PerfilFormInput = { ...valoresVazios, idade: '30', cpf: '123.456.789-01' };
    await render(<PerfilForm {...propsPadrao({ valoresIniciais: valores })} />);

    expect(screen.getByDisplayValue('30')).toBeTruthy();
    expect(screen.getByDisplayValue('123.456.789-01')).toBeTruthy();
  });

  it('aplica a máscara de CPF enquanto o usuário digita', async () => {
    await render(<PerfilForm {...propsPadrao()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('000.000.000-00'), '12345678901');

    expect(screen.getByDisplayValue('123.456.789-01')).toBeTruthy();
  });

  it('chama onSubmit com os valores atuais do formulário ao salvar', async () => {
    const props = propsPadrao();
    await render(<PerfilForm {...props} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Ex.: 32'), '25');
    await fireEvent.press(screen.getByText('Salvar ficha'));

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalled());
    expect(props.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ idade: '25' }));
  });

  it('mostra erro de validação quando um campo está fora do intervalo permitido', async () => {
    await render(<PerfilForm {...propsPadrao()} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Ex.: 32'), '200');
    await fireEvent.press(screen.getByText('Salvar ficha'));

    expect(await screen.findByText('Informe uma idade entre 0 e 130')).toBeTruthy();
  });

  it('exibe a mensagem de erro do servidor e a de sucesso quando informadas', async () => {
    const { rerender } = await render(<PerfilForm {...propsPadrao({ erro: 'Falha ao salvar' })} />);
    expect(screen.getByText('Falha ao salvar')).toBeTruthy();

    await rerender(<PerfilForm {...propsPadrao({ sucesso: true })} />);
    expect(screen.getByText('Ficha salva.')).toBeTruthy();
  });
});
