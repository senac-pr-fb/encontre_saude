import { renderHook, waitFor } from '@testing-library/react-native';

import { container } from '@core/di/container';
import { useContextoSaude } from '../useContextoSaude';
import { useConcluirPreProntuario } from '../useConcluirPreProntuario';
import { useDocumento } from '../useDocumento';
import { montarContexto } from '@domain/usecases/contexto';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { InteracaoHistorico } from '@domain/entities/Triagem';

jest.mock('@core/di/container', () => ({
  container: {
    prontuario: {
      rascunho: { carregar: jest.fn(), salvar: jest.fn() },
      pdf: { imprimir: jest.fn(), compartilhar: jest.fn() },
    },
  },
}));
jest.mock('../useContextoSaude', () => ({ useContextoSaude: jest.fn() }));
jest.mock('../useConcluirPreProntuario', () => ({ useConcluirPreProntuario: jest.fn() }));

const perfil: PerfilSaude = {
  ...perfilVazio('user-1'),
  sexo: 'Feminino',
  cpf: '12345678901',
  dataNascimento: '1990-05-10',
  telefone: '46999998888',
};

const historico: InteracaoHistorico[] = [
  {
    id: 'h1',
    quando: new Date().toISOString(),
    descricao: 'Febre alta desde ontem à noite',
    sintomas: [],
    triagem: { nivel: 3, resumo: 'r', recomendacao: 'rec', primeirosSocorros: '', unidadeRecomendada: 'UBS', sintomas: ['febre'] },
  },
];

const mutate = jest.fn();

function comContexto(p: PerfilSaude) {
  const contexto = montarContexto({ perfil: p, fichaExiste: true, nome: 'Maria Souza', historico });
  (useContextoSaude as jest.Mock).mockReturnValue({ contexto, carregando: false, erro: null });
}

beforeEach(() => {
  jest.clearAllMocks();
  (useConcluirPreProntuario as jest.Mock).mockReturnValue({ mutate });
  (container.prontuario.rascunho.carregar as jest.Mock).mockResolvedValue(null);
  comContexto(perfil);
});

describe('useDocumento', () => {
  it('gera direto do contexto quando tudo é válido', async () => {
    const { result } = await renderHook(() => useDocumento());
    await waitFor(() => expect(result.current.carregando).toBe(false));

    let gerou = false;
    gerou = result.current.gerarDoContexto();

    expect(gerou).toBe(true);
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Maria Souza',
        cpf: '12345678901',
        dataNascimento: '1990-05-10',
        queixaPrincipal: 'Febre alta desde ontem à noite',
        sintomas: ['febre'],
      }),
    );
  });

  it('não gera quando um dado da ficha não passa na validação', async () => {
    comContexto({ ...perfil, sinaisVitais: { ...perfil.sinaisVitais, temperatura: 60 } });
    const { result } = await renderHook(() => useDocumento());
    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.gerarDoContexto()).toBe(false);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('a edição parte do contexto com o rascunho por cima', async () => {
    (container.prontuario.rascunho.carregar as jest.Mock).mockResolvedValue({ telefone: '46911112222' });
    const { result } = await renderHook(() => useDocumento());
    await waitFor(() => expect(result.current.carregando).toBe(false));

    expect(result.current.rascunhoRestaurado).toBe(true);
    expect(result.current.iniciaisEdicao?.telefone).toBe('46911112222');
    expect(result.current.iniciaisEdicao?.queixaPrincipal).toBe('Febre alta desde ontem à noite');
  });

  it('continua carregando enquanto o rascunho não foi lido', async () => {
    (container.prontuario.rascunho.carregar as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = await renderHook(() => useDocumento());
    expect(result.current.carregando).toBe(true);
    expect(result.current.iniciaisEdicao).toBeNull();
  });
});
