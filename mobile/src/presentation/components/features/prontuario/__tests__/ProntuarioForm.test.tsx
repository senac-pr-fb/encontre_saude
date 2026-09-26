import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProntuarioForm } from '../ProntuarioForm';
import { FORMULARIO_VAZIO, type ProntuarioFormInput } from '@domain/usecases/prontuario';

function propsPadrao(overrides: Partial<React.ComponentProps<typeof ProntuarioForm>> = {}) {
  return {
    valoresIniciais: FORMULARIO_VAZIO,
    onRascunho: jest.fn(),
    onConcluir: jest.fn(),
    gerando: false,
    ...overrides,
  };
}

async function preencherEtapa1Valida() {
  await fireEvent.changeText(screen.getByPlaceholderText('Como está no documento'), 'João da Silva');
  await fireEvent.changeText(screen.getByPlaceholderText('dd/mm/aaaa'), '25041990');
  await fireEvent.changeText(screen.getByPlaceholderText('000.000.000-00'), '12345678901');
  await fireEvent.changeText(screen.getByPlaceholderText('(46) 99999-9999'), '11987654321');
}

describe('ProntuarioForm — navegação', () => {
  it('começa na etapa 1 (Dados pessoais)', async () => {
    await render(<ProntuarioForm {...propsPadrao()} />);
    expect(screen.getByPlaceholderText('Como está no documento')).toBeTruthy();
    expect(screen.queryByText('Voltar')).toBeNull();
  });

  it('não avança para a etapa 2 quando os dados da etapa 1 são inválidos', async () => {
    await render(<ProntuarioForm {...propsPadrao()} />);

    await fireEvent.press(screen.getByText('Continuar'));

    expect(await screen.findByText(/Informe o nome completo/)).toBeTruthy();
    expect(screen.getByPlaceholderText('Como está no documento')).toBeTruthy();
  });

  it('avança para a etapa 2 quando os dados da etapa 1 são válidos, e "Voltar" retorna à etapa 1', async () => {
    await render(<ProntuarioForm {...propsPadrao()} />);

    await preencherEtapa1Valida();
    await fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => expect(screen.getByPlaceholderText('Ex.: 2 dias, desde ontem à noite')).toBeTruthy());

    await fireEvent.press(screen.getByText('Voltar'));

    await waitFor(() => expect(screen.getByPlaceholderText('Como está no documento')).toBeTruthy());
  });
});

describe('ProntuarioForm — rascunho automático', () => {
  it('não chama onRascunho na primeira renderização, mas chama após uma edição', async () => {
    const props = propsPadrao();
    await render(<ProntuarioForm {...props} />);

    expect(props.onRascunho).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByPlaceholderText('Como está no documento'), 'J');

    await waitFor(() => expect(props.onRascunho).toHaveBeenCalled());
  });
});

describe('ProntuarioForm — conclusão', () => {
  it('percorre as 4 etapas e chama onConcluir com os dados convertidos', async () => {
    const props = propsPadrao();
    await render(<ProntuarioForm {...props} />);

    // Etapa 1
    await preencherEtapa1Valida();
    await fireEvent.press(screen.getByText('Continuar'));

    // Etapa 2
    await waitFor(() => expect(screen.getByPlaceholderText(/O que você está sentindo/)).toBeTruthy());
    await fireEvent.changeText(screen.getByPlaceholderText(/O que você está sentindo/), 'Dor de cabeça forte há dois dias');
    await fireEvent.press(screen.getByText('Continuar'));

    // Etapa 3 — todos os campos são opcionais, segue sem preencher
    await waitFor(() => expect(screen.getByText('Sinais vitais')).toBeTruthy());
    await fireEvent.press(screen.getByText('Continuar'));

    // Etapa 4 — revisão, mostra o que foi preenchido
    await waitFor(() => expect(screen.getByText('Gerar pré-prontuário')).toBeTruthy());
    expect(screen.getByText('João da Silva')).toBeTruthy();

    await fireEvent.press(screen.getByText('Gerar pré-prontuário'));

    await waitFor(() => expect(props.onConcluir).toHaveBeenCalled());
    const dados = (props.onConcluir as jest.Mock).mock.calls[0][0] as ProntuarioFormInput;
    expect(dados.nome).toBe('João da Silva');
    expect(dados.cpf).toBe('12345678901');
    expect(dados.dataNascimento).toBe('1990-04-25');
    expect(dados.queixaPrincipal).toBe('Dor de cabeça forte há dois dias');
  });
});
