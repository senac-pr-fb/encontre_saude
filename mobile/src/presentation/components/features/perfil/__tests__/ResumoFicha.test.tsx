import { render, screen, fireEvent } from '@testing-library/react-native';
import { ResumoFicha } from '../ResumoFicha';
import type { ContextoSaude } from '@domain/entities/ContextoSaude';

const contexto = (over: Partial<ContextoSaude>) => ({ faltantes: [], completude: 100, ...over }) as ContextoSaude;

describe('ResumoFicha', () => {
  it('mostra o percentual e o que falta para o documento', async () => {
    await render(
      <ResumoFicha contexto={contexto({ completude: 36, faltantes: ['cpf', 'telefone'] })} onPreTriagem={jest.fn()} onManual={jest.fn()} />,
    );
    expect(screen.getByText('36%')).toBeTruthy();
    expect(screen.getByText('Para gerar o pré-prontuário ainda falta: CPF, Telefone.')).toBeTruthy();
  });

  it('com os obrigatórios em dia, sugere completar o histórico clínico', async () => {
    await render(<ResumoFicha contexto={contexto({ completude: 45 })} onPreTriagem={jest.fn()} onManual={jest.fn()} />);
    expect(screen.getByText(/Completar o histórico clínico melhora a triagem/)).toBeTruthy();
  });

  it('a pré-triagem é a ação principal e o manual a alternativa', async () => {
    const onPreTriagem = jest.fn();
    const onManual = jest.fn();
    await render(<ResumoFicha contexto={contexto({})} onPreTriagem={onPreTriagem} onManual={onManual} />);

    expect(screen.getByText('Sua ficha está completa.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Atualizar pela pré-triagem'));
    await fireEvent.press(screen.getByText('Pré-prontuário manual'));
    expect(onPreTriagem).toHaveBeenCalledTimes(1);
    expect(onManual).toHaveBeenCalledTimes(1);
  });
});
