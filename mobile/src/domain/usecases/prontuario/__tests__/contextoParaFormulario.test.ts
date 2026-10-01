import { contextoParaFormulario, mesclarRascunho } from '../contextoParaFormulario';
import { FORMULARIO_VAZIO, prontuarioSchema } from '../prontuarioSchema';
import { perfilVazio, type PerfilSaude } from '@domain/entities/PerfilSaude';
import type { InteracaoHistorico } from '@domain/entities/Triagem';
import { agruparEpisodios } from '@domain/usecases/contexto/episodios';

const perfil: PerfilSaude = {
  ...perfilVazio('user-1'),
  sexo: 'Feminino',
  cpf: '12345678901',
  dataNascimento: '1990-05-10',
  telefone: '46999998888',
  peso: 62.5,
  alergias: 'Dipirona',
  sinaisVitais: { pressaoArterial: '120/80', frequenciaCardiaca: 70, temperatura: null, saturacaoOxigenio: 98 },
};

const relato = (over: Partial<InteracaoHistorico> = {}): InteracaoHistorico => ({
  id: 'h1',
  quando: '2026-09-30T12:00:00Z',
  descricao: 'Febre alta desde ontem à noite',
  sintomas: ['febre'],
  triagem: {
    nivel: 3,
    resumo: 'r',
    recomendacao: 'rec',
    primeirosSocorros: '',
    unidadeRecomendada: 'UBS',
    sintomas: ['febre', 'fraqueza'],
  },
  episodioId: null,
  rotulo: 'febre',
  recorrencia: [],
  ...over,
});

const episodio = agruparEpisodios([relato()])[0];

describe('contextoParaFormulario', () => {
  it('sem ficha, devolve o formulário vazio com o nome da conta', () => {
    expect(contextoParaFormulario(null, 'Maria')).toEqual({ ...FORMULARIO_VAZIO, nome: 'Maria' });
  });

  it('converte a ficha para o formato do formulário', () => {
    const f = contextoParaFormulario(perfil, 'Maria');
    expect(f.dataNascimento).toBe('10/05/1990');
    expect(f.peso).toBe('62.5');
    expect(f.alergias).toBe('Dipirona');
    expect(f.frequenciaCardiaca).toBe('70');
    expect(f.temperatura).toBe('');
    expect(f.queixaPrincipal).toBe('');
    expect(f.sintomas).toEqual([]);
  });

  it('usa o relato como queixa e os sintomas marcados pela IA', () => {
    const f = contextoParaFormulario(perfil, 'Maria', episodio);
    expect(f.queixaPrincipal).toBe('Febre alta desde ontem à noite');
    expect(f.sintomas).toEqual(['febre', 'fraqueza']);
  });

  it('episódio com vários relatos vira linha do tempo, com os sintomas somados', () => {
    const [ep] = agruparEpisodios([
      relato({
        id: 'h2',
        quando: '2026-09-30T14:00:00Z',
        descricao: 'Agora com tosse',
        episodioId: 'h1',
        triagem: { ...relato().triagem!, sintomas: ['tosse'] },
      }),
      relato(),
    ]);
    const f = contextoParaFormulario(perfil, 'Maria', ep);
    expect(f.queixaPrincipal).toMatch(/: Febre alta desde ontem à noite\n\n.*: Agora com tosse$/);
    expect(f.sintomas).toEqual(['febre', 'tosse', 'fraqueza']);
  });

  it('ficha completa + triagem já formam um pré-prontuário válido', () => {
    expect(prontuarioSchema.safeParse(contextoParaFormulario(perfil, 'Maria Souza', episodio)).success).toBe(true);
  });
});

describe('mesclarRascunho', () => {
  const doContexto = contextoParaFormulario(perfil, 'Maria', episodio);

  it('sem rascunho, fica com o contexto', () => {
    expect(mesclarRascunho(doContexto, null)).toBe(doContexto);
  });

  it('o que foi digitado vence o contexto', () => {
    const f = mesclarRascunho(doContexto, { ...doContexto, telefone: '46911112222', queixaPrincipal: 'Outra queixa aqui' });
    expect(f.telefone).toBe('46911112222');
    expect(f.queixaPrincipal).toBe('Outra queixa aqui');
  });

  it('queixa e sintomas em branco no rascunho continuam vindo da triagem', () => {
    const f = mesclarRascunho(doContexto, { ...doContexto, queixaPrincipal: '  ', sintomas: [] });
    expect(f.queixaPrincipal).toBe('Febre alta desde ontem à noite');
    expect(f.sintomas).toEqual(['febre', 'fraqueza']);
  });
});

describe('mesclarRascunho — campos em branco', () => {
  it('não apaga o que a ficha já tem (ex.: CPF salvo depois do rascunho)', () => {
    const doContexto = contextoParaFormulario(perfil, 'Maria', null);
    const f = mesclarRascunho(doContexto, { ...FORMULARIO_VAZIO, cpf: '', alergias: 'Poeira' });
    expect(f.cpf).toBe('12345678901');
    expect(f.alergias).toBe('Poeira');
  });
});
