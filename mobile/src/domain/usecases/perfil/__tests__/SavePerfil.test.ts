import { SavePerfil } from '../SavePerfil';
import type { PerfilFormInput } from '../perfilSchema';
import { ok, err } from '@core/utils/result';
import { ValidationError, NetworkError } from '@domain/errors';
import { perfilVazio } from '@domain/entities/PerfilSaude';
import type { PerfilRepository } from '@domain/repositories/PerfilRepository';

function criarRepoFake(): jest.Mocked<PerfilRepository> {
  return { getByUserId: jest.fn(), upsert: jest.fn() };
}

const formularioValido: PerfilFormInput = {
  idade: '30',
  peso: '70',
  altura: '1,75',
  sexo: 'Masculino',
  cpf: '123.456.789-01',
  dataNascimento: '25/04/2001',
  telefone: '11987654321',
  fuma: false,
  bebe: false,
  alergias: '',
  alergiaMedicamento: '',
  medicamentosEmUso: '',
  doencasPreexistentes: '',
  historicoFamiliar: '',
  possuiDeficiencia: '',
  contatoMedico: { nome: '', email: '', telefone: '' },
  sinaisVitais: { pressaoArterial: '120/80', frequenciaCardiaca: '70', temperatura: '36,5', saturacaoOxigenio: '98' },
  observacoes: '',
};

describe('SavePerfil', () => {
  it('valida, monta a entidade com o userId e grava via repositório', async () => {
    const repo = criarRepoFake();
    repo.upsert.mockResolvedValue(ok(perfilVazio('user-1')));

    const resultado = await new SavePerfil(repo).execute('user-1', formularioValido);

    expect(repo.upsert).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', idade: 30, cpf: '12345678901' }));
    expect(resultado.ok).toBe(true);
  });

  it('retorna erro de validação sem chamar o repositório quando os dados são inválidos', async () => {
    const repo = criarRepoFake();

    const resultado = await new SavePerfil(repo).execute('user-1', { ...formularioValido, idade: '200' });

    expect(repo.upsert).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
  });

  it('propaga o erro vindo do repositório', async () => {
    const repo = criarRepoFake();
    repo.upsert.mockResolvedValue(err(new NetworkError()));

    const resultado = await new SavePerfil(repo).execute('user-1', formularioValido);

    expect(resultado).toEqual(err(new NetworkError()));
  });
});
