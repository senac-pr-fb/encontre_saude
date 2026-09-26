const VALORES_VALIDOS = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://exemplo.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  EXPO_PUBLIC_FIREBASE_API_KEY: 'firebase-key',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'firebase-project',
};

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('env', () => {
  it('expõe os valores quando todas as variáveis estão presentes e válidas', () => {
    Object.assign(process.env, VALORES_VALIDOS);

    const { env } = require('../env');

    expect(env).toEqual({
      supabaseUrl: VALORES_VALIDOS.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: VALORES_VALIDOS.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      firebaseApiKey: VALORES_VALIDOS.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseProjectId: VALORES_VALIDOS.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    });
  });

  it('lança erro quando falta uma variável obrigatória', () => {
    Object.assign(process.env, VALORES_VALIDOS, { EXPO_PUBLIC_SUPABASE_URL: undefined });

    expect(() => require('../env')).toThrow(/Variáveis de ambiente ausentes ou inválidas/);
  });

  it('lança erro quando a URL do Supabase é inválida', () => {
    Object.assign(process.env, VALORES_VALIDOS, { EXPO_PUBLIC_SUPABASE_URL: 'não-é-uma-url' });

    expect(() => require('../env')).toThrow(/Variáveis de ambiente ausentes ou inválidas/);
  });
});
