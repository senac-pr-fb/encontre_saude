import { RealizarTriagem, LIMITE_RELATO } from '../RealizarTriagem';
import { ok, err } from '@core/utils/result';
import { ValidationError, NetworkError } from '@domain/errors';
import type { TriagemRepository } from '@domain/repositories/TriagemRepository';
import type { TriagemLocalRepository } from '@domain/repositories/ProntuarioRepository';
import type { Triagem } from '@domain/entities/Triagem';

function criarRepoFake(): jest.Mocked<TriagemRepository> {
  return { analisar: jest.fn(), historico: jest.fn() };
}

function criarLocalFake(): jest.Mocked<TriagemLocalRepository> {
  return { recente: jest.fn(), registrar: jest.fn() };
}

const triagem: Triagem = {
  nivel: 3,
  resumo: 'Sintomas significativos',
  recomendacao: 'Procure atendimento',
  primeirosSocorros: 'Descanse',
  unidadeRecomendada: 'UPA',
  sintomas: ['febre'],
};

describe('RealizarTriagem', () => {
  it('analisa a descrição e registra o resultado localmente quando dá certo', async () => {
    const repo = criarRepoFake();
    const local = criarLocalFake();
    repo.analisar.mockResolvedValue(ok(triagem));

    const resultado = await new RealizarTriagem(repo, local).execute('Estou com febre alta há dois dias');

    expect(repo.analisar).toHaveBeenCalledWith('Estou com febre alta há dois dias');
    expect(local.registrar).toHaveBeenCalledWith({
      textoUsuario: 'Estou com febre alta há dois dias',
      nivel: triagem.nivel,
      resumo: triagem.resumo,
      recomendacao: triagem.recomendacao,
    });
    expect(resultado).toEqual(ok(triagem));
  });

  it('rejeita descrição muito curta sem chamar o repositório', async () => {
    const repo = criarRepoFake();
    const local = criarLocalFake();

    const resultado = await new RealizarTriagem(repo, local).execute('dor');

    expect(repo.analisar).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(ValidationError);
  });

  it('rejeita descrição maior que o limite permitido', async () => {
    const repo = criarRepoFake();
    const local = criarLocalFake();
    const textoGigante = 'a'.repeat(LIMITE_RELATO + 1);

    const resultado = await new RealizarTriagem(repo, local).execute(textoGigante);

    expect(repo.analisar).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
  });

  it('não registra localmente quando a análise falha', async () => {
    const repo = criarRepoFake();
    const local = criarLocalFake();
    repo.analisar.mockResolvedValue(err(new NetworkError()));

    const resultado = await new RealizarTriagem(repo, local).execute('Estou com febre alta há dois dias');

    expect(local.registrar).not.toHaveBeenCalled();
    expect(resultado).toEqual(err(new NetworkError()));
  });

  it('remove espaços das bordas antes de validar o tamanho', async () => {
    const repo = criarRepoFake();
    const local = criarLocalFake();
    repo.analisar.mockResolvedValue(ok(triagem));

    await new RealizarTriagem(repo, local).execute('   Estou com febre alta há dois dias   ');

    expect(repo.analisar).toHaveBeenCalledWith('Estou com febre alta há dois dias');
  });
});
