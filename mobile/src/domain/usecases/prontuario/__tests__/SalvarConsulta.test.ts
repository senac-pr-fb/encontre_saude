import { SalvarConsulta } from '../SalvarConsulta';
import { ok, err } from '@core/utils/result';
import { NetworkError } from '@domain/errors';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { PreProntuario } from '@domain/entities/PreProntuario';
import type { ProntuarioRepository } from '@domain/repositories/ProntuarioRepository';
import type { PerfilRepository } from '@domain/repositories/PerfilRepository';

function criarProntuariosFake(): jest.Mocked<ProntuarioRepository> {
  return { salvarConsulta: jest.fn() };
}

function criarPerfisFake(): jest.Mocked<PerfilRepository> {
  return { getByUserId: jest.fn(), upsert: jest.fn() };
}

const preProntuario: PreProntuario = {
  nome: 'João da Silva',
  dataNascimento: '2001-04-25',
  cpf: '12345678901',
  sexo: 'Masculino',
  telefone: '11987654321',
  queixaPrincipal: 'Dor de cabeça forte',
  tempoSintoma: '2 dias',
  sintomas: ['febre'],
  alergias: null,
  medicamentosEmUso: null,
  doencasPreexistentes: null,
  historicoFamiliar: null,
  pressaoArterial: null,
  frequenciaCardiaca: null,
  temperatura: null,
  saturacaoOxigenio: null,
  peso: 70,
  altura: 1.75,
  observacoes: null,
};

describe('SalvarConsulta', () => {
  it('grava a consulta e sincroniza o perfil, mantendo campos antigos quando o pré-prontuário não os informa', async () => {
    const prontuarios = criarProntuariosFake();
    const perfis = criarPerfisFake();
    prontuarios.salvarConsulta.mockResolvedValue(ok(undefined));

    const perfilAtual: PerfilSaude = {
      ...perfilVazio('user-1'),
      alergias: 'Poeira',
      sinaisVitais: { pressaoArterial: '110/70', frequenciaCardiaca: 60, temperatura: 36, saturacaoOxigenio: 97 },
    };
    perfis.getByUserId.mockResolvedValue(ok(perfilAtual));
    perfis.upsert.mockResolvedValue(ok(perfilAtual));

    const resultado = await new SalvarConsulta(prontuarios, perfis).execute('user-1', preProntuario);

    expect(prontuarios.salvarConsulta).toHaveBeenCalledWith('user-1', preProntuario);
    expect(perfis.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        cpf: '12345678901',
        peso: 70,
        altura: 1.75,
        // Não informado no pré-prontuário: mantém o valor antigo do perfil.
        alergias: 'Poeira',
        sinaisVitais: expect.objectContaining({ pressaoArterial: '110/70', frequenciaCardiaca: 60 }),
      }),
    );
    expect(resultado).toEqual(ok(undefined));
  });

  it('usa um perfil vazio como base quando o usuário ainda não tem ficha', async () => {
    const prontuarios = criarProntuariosFake();
    const perfis = criarPerfisFake();
    prontuarios.salvarConsulta.mockResolvedValue(ok(undefined));
    perfis.getByUserId.mockResolvedValue(ok(null));
    perfis.upsert.mockResolvedValue(ok(perfilVazio('user-1')));

    await new SalvarConsulta(prontuarios, perfis).execute('user-1', preProntuario);

    expect(perfis.upsert).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', peso: 70 }));
  });

  it('não sincroniza o perfil e retorna o erro quando salvar a consulta falha', async () => {
    const prontuarios = criarProntuariosFake();
    const perfis = criarPerfisFake();
    prontuarios.salvarConsulta.mockResolvedValue(err(new NetworkError()));

    const resultado = await new SalvarConsulta(prontuarios, perfis).execute('user-1', preProntuario);

    expect(perfis.getByUserId).not.toHaveBeenCalled();
    expect(resultado).toEqual(err(new NetworkError()));
  });

  it('retorna sucesso mesmo quando a sincronização do perfil falha (a consulta já foi salva)', async () => {
    const prontuarios = criarProntuariosFake();
    const perfis = criarPerfisFake();
    prontuarios.salvarConsulta.mockResolvedValue(ok(undefined));
    perfis.getByUserId.mockResolvedValue(ok(perfilVazio('user-1')));
    perfis.upsert.mockResolvedValue(err(new NetworkError()));

    const resultado = await new SalvarConsulta(prontuarios, perfis).execute('user-1', preProntuario);

    expect(resultado).toEqual(ok(undefined));
  });
});
