import { GetHistorico } from '../GetHistorico';
import { ok, err } from '@core/utils/result';
import { NetworkError } from '@domain/errors';
import type { TriagemRepository } from '@domain/repositories/TriagemRepository';
import type { InteracaoHistorico } from '@domain/entities/Triagem';

function criarRepoFake(): jest.Mocked<TriagemRepository> {
  return { analisar: jest.fn(), historico: jest.fn() };
}

describe('GetHistorico', () => {
  it('delega ao repositório com o userId informado', async () => {
    const repo = criarRepoFake();
    const historico: InteracaoHistorico[] = [];
    repo.historico.mockResolvedValue(ok(historico));

    const resultado = await new GetHistorico(repo).execute('user-1');

    expect(repo.historico).toHaveBeenCalledWith('user-1');
    expect(resultado).toEqual(ok(historico));
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.historico.mockResolvedValue(err(new NetworkError()));

    const resultado = await new GetHistorico(repo).execute('user-1');

    expect(resultado).toEqual(err(new NetworkError()));
  });
});
