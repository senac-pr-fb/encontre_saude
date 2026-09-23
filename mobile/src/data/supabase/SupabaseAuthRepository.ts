import type { SupabaseClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { AuthRepository, EventoAuth, OrigemLink, ResultadoSignUp } from '@domain/repositories/AuthRepository';
import type { Usuario } from '@domain/entities/Usuario';
import { AuthError } from '@domain/errors';
import { ok, err, type Result } from '@core/utils/result';
import { usuarioMapper } from '@data/mappers/usuarioMapper';
import { toAuthError } from './errors';

/**
 * Tradução de frontend/Services/authService.js para o mobile.
 * Diferenças: OAuth abre o browser do sistema e volta por deep link (não há
 * window.location), e a recuperação de senha entra no app pelo link do e-mail.
 */
export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async signIn(email: string, senha: string): Promise<Result<Usuario, AuthError>> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return err(toAuthError(error));
    return ok(usuarioMapper.toEntity(data.user));
  }

  async signUp(email: string, senha: string): Promise<Result<ResultadoSignUp, AuthError>> {
    const { data, error } = await this.supabase.auth.signUp({ email, password: senha });
    if (error) return err(toAuthError(error));
    if (!data.user) return err(new AuthError('Não foi possível criar a conta'));
    return ok({ usuario: usuarioMapper.toEntity(data.user), precisaConfirmarEmail: data.session === null });
  }

  async signOut(): Promise<Result<void, AuthError>> {
    const { error } = await this.supabase.auth.signOut();
    if (error) return err(toAuthError(error));
    return ok(undefined);
  }

  async signInWithGoogle(): Promise<Result<Usuario, AuthError>> {
    // Rota existente do app: no Expo Go vira exp://…/--/login, em build vira encontresaude:///login.
    // Ambas precisam estar em Authentication → URL Configuration → Redirect URLs.
    // Se não estiverem, o Supabase ignora este valor e redireciona para o Site URL
    // do projeto (o site na Vercel) — o browser abre a página e nunca volta ao app.
    const redirectTo = Linking.createURL('/login');
    if (__DEV__) console.log('[auth] redirectTo (autorize esta URL no Supabase):', redirectTo);

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return err(toAuthError(error));

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') {
      return err(
        new AuthError(
          `Login com Google não retornou ao app. Verifique se ${redirectTo} está em Authentication → URL Configuration → Redirect URLs no Supabase.`,
        ),
      );
    }

    const restaurado = await this.restaurarSessaoDeLink(res.url);
    if (!restaurado.ok) return restaurado;

    const usuario = await this.getUsuarioAtual();
    return usuario ? ok(usuario) : err(new AuthError('Não foi possível concluir o login com Google'));
  }

  async getUsuarioAtual(): Promise<Usuario | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session ? usuarioMapper.toEntity(data.session.user) : null;
  }

  onAuthStateChange(cb: (usuario: Usuario | null, evento: EventoAuth) => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange((evento, session) => {
      cb(session ? usuarioMapper.toEntity(session.user) : null, evento);
    });
    return () => data.subscription.unsubscribe();
  }

  async enviarRecuperacaoSenha(email: string): Promise<Result<void, AuthError>> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('/nova-senha'),
    });
    if (error) return err(toAuthError(error));
    return ok(undefined);
  }

  async atualizarSenha(novaSenha: string): Promise<Result<void, AuthError>> {
    const { error } = await this.supabase.auth.updateUser({ password: novaSenha });
    if (error) return err(toAuthError(error));
    return ok(undefined);
  }

  async atualizarNome(nome: string): Promise<Result<void, AuthError>> {
    const { error } = await this.supabase.auth.updateUser({ data: { full_name: nome } });
    if (error) return err(toAuthError(error));
    return ok(undefined);
  }

  iniciarAutoRefresh() {
    this.supabase.auth.startAutoRefresh();
  }

  pararAutoRefresh() {
    this.supabase.auth.stopAutoRefresh();
  }

  async restaurarSessaoDeLink(url: string): Promise<Result<OrigemLink, AuthError>> {
    const params = parseParams(url);
    if (params.error_description) return err(new AuthError(params.error_description));

    const { access_token, refresh_token, type } = params;
    if (!access_token || !refresh_token) return ok(null);

    const { error } = await this.supabase.auth.setSession({ access_token, refresh_token });
    if (error) return err(toAuthError(error));
    return ok(type === 'recovery' ? 'recuperacao' : 'login');
  }
}

/** O Supabase devolve os tokens no fragmento (#a=b) ou na query (?a=b); lê os dois. */
function parseParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const [semFragmento, fragmento] = url.split('#');
  const query = semFragmento.split('?')[1];
  for (const parte of [query, fragmento]) {
    if (!parte) continue;
    for (const [k, v] of new URLSearchParams(parte)) out[k] = v;
  }
  return out;
}
