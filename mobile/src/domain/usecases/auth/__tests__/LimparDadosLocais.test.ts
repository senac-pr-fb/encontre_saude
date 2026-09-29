import { LimparDadosLocais } from '../LimparDadosLocais';

describe('LimparDadosLocais', () => {
  it('delega ao serviço de limpeza', async () => {
    const limpeza = { limpar: jest.fn().mockResolvedValue(undefined) };

    await new LimparDadosLocais(limpeza).execute();

    expect(limpeza.limpar).toHaveBeenCalledTimes(1);
  });
});
