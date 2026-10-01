import { AtualizarFichaClinica, sugestaoDeRecorrencia, sugestoesParaFicha } from '../AtualizarFichaClinica';
import type { AnaliseTriagem } from '@domain/entities/Triagem';
import { ok } from '@core/utils/result';
import { ValidationError } from '@domain/errors';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { PerfilRepository } from '@domain/repositories/PerfilRepository';

const atual: PerfilSaude = { ...perfilVazio('user-1'), alergias: 'Dipirona', cpf: '12345678901' };

describe('sugestoesParaFicha', () => {
  it('só sugere o que foi informado e é diferente da ficha', () => {
    const s = sugestoesParaFicha(
      { alergias: ' dipirona ', medicamentosEmUso: 'Losartana 50 mg', doencasPreexistentes: null },
      atual,
    );
    expect(s).toEqual({ medicamentosEmUso: 'Losartana 50 mg' });
  });

  it('sem nada novo, não sugere nada', () => {
    expect(sugestoesParaFicha({ alergias: null, medicamentosEmUso: '  ', doencasPreexistentes: null }, atual)).toEqual({});
  });
});

describe('AtualizarFichaClinica', () => {
  function criar() {
    const perfis: jest.Mocked<PerfilRepository> = {
      getByUserId: jest.fn().mockResolvedValue(ok(atual)),
      upsert: jest.fn().mockImplementation(async (p: PerfilSaude) => ok(p)),
    };
    return { perfis, uc: new AtualizarFichaClinica(perfis) };
  }

  it('grava só os campos confirmados, mantendo o resto da ficha', async () => {
    const { perfis, uc } = criar();

    await uc.execute('user-1', { medicamentosEmUso: ' Losartana 50 mg ' });

    expect(perfis.upsert).toHaveBeenCalledWith({ ...atual, medicamentosEmUso: 'Losartana 50 mg' });
  });

  it('sem nada para gravar, não toca na ficha', async () => {
    const { perfis, uc } = criar();

    const r = await uc.execute('user-1', { alergias: '  ' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
    expect(perfis.getByUserId).not.toHaveBeenCalled();
  });
});

describe('sugestaoDeRecorrencia', () => {
  const analise = (episodios: number, continuacao = false): AnaliseTriagem => ({
    triagem: { nivel: 2, resumo: '', recomendacao: '', primeirosSocorros: '', unidadeRecomendada: '', sintomas: [] },
    perguntas: [],
    atualizacoes: { alergias: null, medicamentosEmUso: null, doencasPreexistentes: null },
    historicoId: '1',
    rotulo: 'dor de cabeça',
    episodioAnterior: continuacao ? { id: '0', desde: '2026-09-30T10:00:00Z', rotulo: 'dor de cabeça' } : null,
    recorrencia: [{ rotulo: 'dor de cabeça', episodios, ultimos30Dias: 1, ultimoEm: '', nivelMax: 2 }],
  });

  it('com 3 episódios (2 anteriores + este), sugere anotar nas observações', () => {
    expect(sugestaoDeRecorrencia(atual, analise(2))).toEqual({
      observacoes: 'Dor de cabeça frequente: 3 episódios em 6 meses.',
    });
  });

  it('numa continuação, o episódio já está na conta', () => {
    expect(sugestaoDeRecorrencia(atual, analise(2, true))).toEqual({});
  });

  it('acrescenta ao que já houver e não repete a anotação', () => {
    const comObs = { ...atual, observacoes: 'Usa óculos' };
    expect(sugestaoDeRecorrencia(comObs, analise(4)).observacoes).toBe(
      'Usa óculos\nDor de cabeça frequente: 5 episódios em 6 meses.',
    );
    const jaAnotado = { ...atual, observacoes: 'Dor de cabeça frequente: 3 episódios em 6 meses.' };
    expect(sugestaoDeRecorrencia(jaAnotado, analise(4))).toEqual({});
  });
});
