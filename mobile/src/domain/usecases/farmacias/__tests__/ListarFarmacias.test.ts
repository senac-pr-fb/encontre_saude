import { ListarFarmacias } from '../ListarFarmacias';
import { ok, err } from '@core/utils/result';
import { NetworkError } from '@domain/errors';
import type { FarmaciaRepository } from '@domain/repositories/FarmaciaRepository';
import type { Farmacia } from '@domain/entities/Farmacia';

function criarRepoFake(): jest.Mocked<FarmaciaRepository> {
  return { listar: jest.fn() };
}

describe('ListarFarmacias', () => {
  it('delega diretamente ao repositório', async () => {
    const repo = criarRepoFake();
    const farmacias: Farmacia[] = [];
    repo.listar.mockResolvedValue(ok(farmacias));

    const resultado = await new ListarFarmacias(repo).execute();

    expect(repo.listar).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual(ok(farmacias));
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.listar.mockResolvedValue(err(new NetworkError()));

    const resultado = await new ListarFarmacias(repo).execute();

    expect(resultado).toEqual(err(new NetworkError()));
  });
});
