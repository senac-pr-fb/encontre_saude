import { GetPerfil } from '../GetPerfil';
import { ok, err } from '@core/utils/result';
import { NotFoundError } from '@domain/errors';
import { perfilVazio } from '@domain/entities/PerfilSaude';
import type { PerfilRepository } from '@domain/repositories/PerfilRepository';

function criarRepoFake(): jest.Mocked<PerfilRepository> {
  return { getByUserId: jest.fn(), upsert: jest.fn() };
}

describe('GetPerfil', () => {
  it('delega ao repositório com o userId informado', async () => {
    const repo = criarRepoFake();
    const perfil = perfilVazio('user-1');
    repo.getByUserId.mockResolvedValue(ok(perfil));

    const resultado = await new GetPerfil(repo).execute('user-1');

    expect(repo.getByUserId).toHaveBeenCalledWith('user-1');
    expect(resultado).toEqual(ok(perfil));
  });

  it('devolve null quando o usuário ainda não tem ficha', async () => {
    const repo = criarRepoFake();
    repo.getByUserId.mockResolvedValue(ok(null));

    const resultado = await new GetPerfil(repo).execute('user-1');

    expect(resultado).toEqual(ok(null));
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.getByUserId.mockResolvedValue(err(new NotFoundError()));

    const resultado = await new GetPerfil(repo).execute('user-1');

    expect(resultado).toEqual(err(new NotFoundError()));
  });
});
