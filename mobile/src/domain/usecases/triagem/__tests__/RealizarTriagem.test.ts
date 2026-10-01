import { RealizarTriagem, LIMITE_RELATO, LIMITE_RESPOSTA } from '../RealizarTriagem';
import { ok, err } from '@core/utils/result';
import { ValidationError, NetworkError } from '@domain/errors';
import type { TriagemRepository } from '@domain/repositories/TriagemRepository';
import type { AnaliseTriagem, Triagem } from '@domain/entities/Triagem';

function criarRepoFake(): jest.Mocked<TriagemRepository> {
  return { analisar: jest.fn(), historico: jest.fn(), desvincularEpisodio: jest.fn() };
}

const triagem: Triagem = {
  nivel: 3,
  resumo: 'Sintomas significativos',
  recomendacao: 'Procure atendimento',
  primeirosSocorros: 'Descanse',
  unidadeRecomendada: 'UPA',
  sintomas: ['febre'],
};

const analise: AnaliseTriagem = {
  triagem,
  perguntas: [{ campo: 'alergias', pergunta: 'Tem alergia a algum remédio?' }],
  atualizacoes: { alergias: null, medicamentosEmUso: null, doencasPreexistentes: null },
  historicoId: '42',
  rotulo: 'febre',
  episodioAnterior: null,
  recorrencia: [],
};

describe('RealizarTriagem', () => {
  it('analisa a descrição e devolve o resultado', async () => {
    const repo = criarRepoFake();
    repo.analisar.mockResolvedValue(ok(analise));

    const resultado = await new RealizarTriagem(repo).execute('Estou com febre alta há dois dias');

    expect(repo.analisar).toHaveBeenCalledWith('Estou com febre alta há dois dias');
    expect(resultado).toEqual(ok(analise));
  });

  it('rejeita descrição muito curta sem chamar o repositório', async () => {
    const repo = criarRepoFake();

    const resultado = await new RealizarTriagem(repo).execute('dor');

    expect(repo.analisar).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
  });

  it('rejeita descrição maior que o limite permitido', async () => {
    const repo = criarRepoFake();

    const resultado = await new RealizarTriagem(repo).execute('a'.repeat(LIMITE_RELATO + 1));

    expect(repo.analisar).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
  });

  it('propaga a falha da análise', async () => {
    const repo = criarRepoFake();
    repo.analisar.mockResolvedValue(err(new NetworkError()));

    const resultado = await new RealizarTriagem(repo).execute('Estou com febre alta há dois dias');

    expect(resultado).toEqual(err(new NetworkError()));
  });

  it('remove espaços das bordas antes de validar o tamanho', async () => {
    const repo = criarRepoFake();
    repo.analisar.mockResolvedValue(ok(analise));

    await new RealizarTriagem(repo).execute('   Estou com febre alta há dois dias   ');

    expect(repo.analisar).toHaveBeenCalledWith('Estou com febre alta há dois dias');
  });
});

describe('RealizarTriagem — segunda rodada', () => {
  const relato = 'Estou com febre alta há dois dias';

  it('envia só as respostas preenchidas, com o registro da primeira rodada', async () => {
    const repo = criarRepoFake();
    repo.analisar.mockResolvedValue(ok({ ...analise, perguntas: [] }));

    await new RealizarTriagem(repo).execute(relato, {
      respostas: [
        { pergunta: 'Tem alergia?', resposta: ' Dipirona ' },
        { pergunta: 'Usa remédio?', resposta: '   ' },
      ],
      historicoId: '42',
    });

    expect(repo.analisar).toHaveBeenCalledWith(relato, {
      respostas: [{ pergunta: 'Tem alergia?', resposta: 'Dipirona' }],
      historicoId: '42',
    });
  });

  it('exige pelo menos uma resposta', async () => {
    const repo = criarRepoFake();

    const resultado = await new RealizarTriagem(repo).execute(relato, {
      respostas: [{ pergunta: 'Tem alergia?', resposta: '' }],
      historicoId: '42',
    });

    expect(resultado.ok).toBe(false);
    expect(repo.analisar).not.toHaveBeenCalled();
  });

  it('recusa resposta maior que o limite', async () => {
    const repo = criarRepoFake();

    const resultado = await new RealizarTriagem(repo).execute(relato, {
      respostas: [{ pergunta: 'Tem alergia?', resposta: 'a'.repeat(LIMITE_RESPOSTA + 1) }],
      historicoId: '42',
    });

    expect(resultado.ok).toBe(false);
    expect(repo.analisar).not.toHaveBeenCalled();
  });
});
