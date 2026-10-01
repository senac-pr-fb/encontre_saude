import { render, screen, fireEvent } from '@testing-library/react-native';
import { PerguntasTriagem } from '../PerguntasTriagem';
import type { PerguntaTriagem } from '@domain/entities/Triagem';

const perguntas: PerguntaTriagem[] = [
  { campo: 'alergias', pergunta: 'Tem alergia a algum remédio?' },
  { campo: 'sintoma', pergunta: 'Há quanto tempo?' },
];

describe('PerguntasTriagem', () => {
  it('só envia depois de alguma resposta, com todas as perguntas na ordem', async () => {
    const onEnviar = jest.fn();
    await render(<PerguntasTriagem perguntas={perguntas} onEnviar={onEnviar} onPular={jest.fn()} enviando={false} />);

    await fireEvent.press(screen.getByText('Enviar respostas'));
    expect(onEnviar).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Há quanto tempo?'), 'Dois dias');
    await fireEvent.press(screen.getByText('Enviar respostas'));

    expect(onEnviar).toHaveBeenCalledWith([
      { pergunta: 'Tem alergia a algum remédio?', resposta: '' },
      { pergunta: 'Há quanto tempo?', resposta: 'Dois dias' },
    ]);
  });

  it('permite pular', async () => {
    const onPular = jest.fn();
    await render(<PerguntasTriagem perguntas={perguntas} onEnviar={jest.fn()} onPular={onPular} enviando={false} />);

    await fireEvent.press(screen.getByText('Pular'));
    expect(onPular).toHaveBeenCalledTimes(1);
  });
});
