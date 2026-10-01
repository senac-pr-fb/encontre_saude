import { AtualizarFichaClinica, sugestoesParaFicha } from '../AtualizarFichaClinica';
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
