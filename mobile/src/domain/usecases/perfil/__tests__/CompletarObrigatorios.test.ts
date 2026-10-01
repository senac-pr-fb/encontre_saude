import { CompletarObrigatorios } from '../CompletarObrigatorios';
import { ok, err } from '@core/utils/result';
import { NetworkError, ValidationError } from '@domain/errors';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { PerfilRepository } from '@domain/repositories/PerfilRepository';
import type { AuthRepository } from '@domain/repositories/AuthRepository';

const atual: PerfilSaude = { ...perfilVazio('user-1'), alergias: 'Dipirona', telefone: '46999998888' };

function criar() {
  const perfis: jest.Mocked<PerfilRepository> = {
    getByUserId: jest.fn().mockResolvedValue(ok(atual)),
    upsert: jest.fn().mockImplementation(async (p: PerfilSaude) => ok(p)),
  };
  const auth = { atualizarNome: jest.fn().mockResolvedValue(ok(undefined)) } as unknown as jest.Mocked<AuthRepository>;
  return { perfis, auth, uc: new CompletarObrigatorios(perfis, auth) };
}

describe('CompletarObrigatorios', () => {
  it('grava só os campos informados, convertidos, sem mexer no resto da ficha', async () => {
    const { perfis, auth, uc } = criar();

    const r = await uc.execute('user-1', { cpf: '123.456.789-01', dataNascimento: '25/04/1990', sexo: 'Feminino' });

    expect(r.ok).toBe(true);
    expect(perfis.upsert).toHaveBeenCalledWith({
      ...atual,
      cpf: '12345678901',
      dataNascimento: '1990-04-25',
      sexo: 'Feminino',
    });
    expect(auth.atualizarNome).not.toHaveBeenCalled();
  });

  it('o nome vai para a conta; sem outros campos, a ficha não é regravada', async () => {
    const { perfis, auth, uc } = criar();

    const r = await uc.execute('user-1', { nome: '  Maria Souza ' });

    expect(r).toEqual(ok(atual));
    expect(auth.atualizarNome).toHaveBeenCalledWith('Maria Souza');
    expect(perfis.upsert).not.toHaveBeenCalled();
  });

  it('recusa com a mesma regra do formulário', async () => {
    const { perfis, uc } = criar();

    const r = await uc.execute('user-1', { cpf: '123' });

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(ValidationError);
      expect(r.error.message).toBe('O CPF precisa ter 11 dígitos');
    }
    expect(perfis.upsert).not.toHaveBeenCalled();
  });

  it('sem ficha salva, parte de uma ficha vazia', async () => {
    const { perfis, uc } = criar();
    perfis.getByUserId.mockResolvedValue(ok(null));

    await uc.execute('user-1', { telefone: '(46) 98888-7777' });

    expect(perfis.upsert).toHaveBeenCalledWith({ ...perfilVazio('user-1'), telefone: '(46) 98888-7777' });
  });

  it('falha ao ler a ficha não grava nada', async () => {
    const { perfis, uc } = criar();
    perfis.getByUserId.mockResolvedValue(err(new NetworkError()));

    const r = await uc.execute('user-1', { cpf: '12345678901' });

    expect(r.ok).toBe(false);
    expect(perfis.upsert).not.toHaveBeenCalled();
  });
});
