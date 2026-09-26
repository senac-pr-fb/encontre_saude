import type { SupabaseClient, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { SupabaseAuthRepository } from '../SupabaseAuthRepository';
import { AuthError } from '@domain/errors';

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock('expo-linking', () => ({ createURL: jest.fn((path: string) => `encontresaude://${path}`) }));

function criarUserFake(overrides: Partial<User> = {}): User {
  return { id: 'user-1', email: 'a@b.com', user_metadata: {}, app_metadata: {}, aud: 'authenticated', created_at: '' , ...overrides } as User;
}

function criarSupabaseFake() {
  return {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
      setSession: jest.fn(),
    },
  } as unknown as SupabaseClient;
}

describe('SupabaseAuthRepository.signIn', () => {
  it('mapeia o usuário quando o login dá certo', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { user: criarUserFake() }, error: null });

    const resultado = await new SupabaseAuthRepository(supabase).signIn('a@b.com', '123456');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: '123456' });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value).toEqual({ id: 'user-1', email: 'a@b.com', nome: null });
  });

  it('traduz o erro do Supabase', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const resultado = await new SupabaseAuthRepository(supabase).signIn('a@b.com', 'errada');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.message).toBe('E-mail ou senha incorretos');
  });
});

describe('SupabaseAuthRepository.signUp', () => {
  it('indica que precisa confirmar e-mail quando não há sessão', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: { user: criarUserFake(), session: null }, error: null });

    const resultado = await new SupabaseAuthRepository(supabase).signUp('a@b.com', '123456');

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.precisaConfirmarEmail).toBe(true);
  });

  it('indica que não precisa confirmar quando já há sessão', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: criarUserFake(), session: { access_token: 'x' } },
      error: null,
    });

    const resultado = await new SupabaseAuthRepository(supabase).signUp('a@b.com', '123456');

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.precisaConfirmarEmail).toBe(false);
  });

  it('retorna erro quando o Supabase não devolve usuário', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: { user: null, session: null }, error: null });

    const resultado = await new SupabaseAuthRepository(supabase).signUp('a@b.com', '123456');

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(AuthError);
  });

  it('propaga o erro do Supabase', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: { user: null, session: null }, error: { message: 'já registrado' } });

    const resultado = await new SupabaseAuthRepository(supabase).signUp('a@b.com', '123456');

    expect(resultado.ok).toBe(false);
  });
});

describe('SupabaseAuthRepository.signOut', () => {
  it('retorna sucesso quando o Supabase não retorna erro', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    const resultado = await new SupabaseAuthRepository(supabase).signOut();

    expect(resultado).toEqual({ ok: true, value: undefined });
  });

  it('propaga o erro do Supabase', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: { message: 'falha' } });

    const resultado = await new SupabaseAuthRepository(supabase).signOut();

    expect(resultado.ok).toBe(false);
  });
});

describe('SupabaseAuthRepository.getUsuarioAtual', () => {
  it('devolve o usuário mapeado quando há sessão', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: criarUserFake() } } });

    const usuario = await new SupabaseAuthRepository(supabase).getUsuarioAtual();

    expect(usuario).toEqual({ id: 'user-1', email: 'a@b.com', nome: null });
  });

  it('devolve null quando não há sessão', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

    const usuario = await new SupabaseAuthRepository(supabase).getUsuarioAtual();

    expect(usuario).toBeNull();
  });
});

describe('SupabaseAuthRepository.onAuthStateChange', () => {
  it('encaminha o usuário mapeado e o evento, e permite cancelar a assinatura', () => {
    const unsubscribe = jest.fn();
    const supabase = criarSupabaseFake();
    let callbackRegistrado: ((evento: string, session: unknown) => void) | undefined;
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb: (evento: string, session: unknown) => void) => {
      callbackRegistrado = cb;
      return { data: { subscription: { unsubscribe } } };
    });

    const cb = jest.fn();
    const parar = new SupabaseAuthRepository(supabase).onAuthStateChange(cb);

    callbackRegistrado?.('SIGNED_IN', { user: criarUserFake() });
    expect(cb).toHaveBeenCalledWith({ id: 'user-1', email: 'a@b.com', nome: null }, 'SIGNED_IN');

    callbackRegistrado?.('SIGNED_OUT', null);
    expect(cb).toHaveBeenCalledWith(null, 'SIGNED_OUT');

    parar();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('SupabaseAuthRepository.enviarRecuperacaoSenha / atualizarSenha / atualizarNome', () => {
  it('enviarRecuperacaoSenha delega ao Supabase com o redirect correto', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

    const resultado = await new SupabaseAuthRepository(supabase).enviarRecuperacaoSenha('a@b.com');

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: 'encontresaude:///nova-senha',
    });
    expect(resultado.ok).toBe(true);
  });

  it('atualizarSenha delega ao Supabase', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });

    const resultado = await new SupabaseAuthRepository(supabase).atualizarSenha('novaSenha123');

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' });
    expect(resultado.ok).toBe(true);
  });

  it('atualizarNome grava em user_metadata.full_name', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null });

    await new SupabaseAuthRepository(supabase).atualizarNome('Fulano');

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: { full_name: 'Fulano' } });
  });
});

describe('SupabaseAuthRepository.iniciarAutoRefresh / pararAutoRefresh', () => {
  it('delegam para o supabase-js', () => {
    const supabase = criarSupabaseFake();
    const repo = new SupabaseAuthRepository(supabase);

    repo.iniciarAutoRefresh();
    repo.pararAutoRefresh();

    expect(supabase.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(supabase.auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('SupabaseAuthRepository.restaurarSessaoDeLink', () => {
  it('devolve erro quando a URL traz error_description', async () => {
    const supabase = criarSupabaseFake();
    const url = 'encontresaude://login?error_description=Link+expirado';

    const resultado = await new SupabaseAuthRepository(supabase).restaurarSessaoDeLink(url);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.message).toBe('Link expirado');
  });

  it('devolve null quando a URL não traz tokens', async () => {
    const supabase = criarSupabaseFake();

    const resultado = await new SupabaseAuthRepository(supabase).restaurarSessaoDeLink('encontresaude://login');

    expect(resultado).toEqual({ ok: true, value: null });
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
  });

  it('restaura a sessão e identifica login a partir do fragmento da URL', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.setSession as jest.Mock).mockResolvedValue({ error: null });
    const url = 'encontresaude://login#access_token=abc&refresh_token=def&type=login';

    const resultado = await new SupabaseAuthRepository(supabase).restaurarSessaoDeLink(url);

    expect(supabase.auth.setSession).toHaveBeenCalledWith({ access_token: 'abc', refresh_token: 'def' });
    expect(resultado).toEqual({ ok: true, value: 'login' });
  });

  it('identifica recuperação de senha quando type=recovery', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.setSession as jest.Mock).mockResolvedValue({ error: null });
    const url = 'encontresaude://nova-senha#access_token=abc&refresh_token=def&type=recovery';

    const resultado = await new SupabaseAuthRepository(supabase).restaurarSessaoDeLink(url);

    expect(resultado).toEqual({ ok: true, value: 'recuperacao' });
  });

  it('propaga o erro quando setSession falha', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.setSession as jest.Mock).mockResolvedValue({ error: { message: 'sessão inválida' } });
    const url = 'encontresaude://login#access_token=abc&refresh_token=def&type=login';

    const resultado = await new SupabaseAuthRepository(supabase).restaurarSessaoDeLink(url);

    expect(resultado.ok).toBe(false);
  });
});

describe('SupabaseAuthRepository.signInWithGoogle', () => {
  it('completa o fluxo: abre o browser, restaura a sessão e devolve o usuário', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth.exemplo.com' }, error: null });
    (supabase.auth.setSession as jest.Mock).mockResolvedValue({ error: null });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: criarUserFake() } } });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: 'success',
      url: 'encontresaude://login#access_token=abc&refresh_token=def&type=login',
    });

    const resultado = await new SupabaseAuthRepository(supabase).signInWithGoogle();

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value).toEqual({ id: 'user-1', email: 'a@b.com', nome: null });
  });

  it('retorna erro quando o Supabase falha ao iniciar o OAuth', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: null }, error: { message: 'falha oauth' } });

    const resultado = await new SupabaseAuthRepository(supabase).signInWithGoogle();

    expect(resultado.ok).toBe(false);
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('retorna erro quando o usuário cancela o browser', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth.exemplo.com' }, error: null });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'cancel' });

    const resultado = await new SupabaseAuthRepository(supabase).signInWithGoogle();

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toBeInstanceOf(AuthError);
  });

  it('retorna erro quando a sessão não é restaurada com sucesso após o browser', async () => {
    const supabase = criarSupabaseFake();
    (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: 'https://oauth.exemplo.com' }, error: null });
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: 'success',
      url: 'encontresaude://login?error_description=falhou',
    });

    const resultado = await new SupabaseAuthRepository(supabase).signInWithGoogle();

    expect(resultado.ok).toBe(false);
  });
});
