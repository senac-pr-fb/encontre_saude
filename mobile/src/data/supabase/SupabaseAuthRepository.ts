import type { SupabaseClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { AuthRepository, EventoAuth, OrigemLink, ResultadoSignUp } from '@domain/repositories/AuthRepository';
import type { Usuario } from '@domain/entities/Usuario';
import { AuthError } from '@domain/errors';
import { ok, err, type Result } from '@core/utils/result';
import { usuarioMapper } from '@data/mappers/usuarioMapper';
import { toAuthError } from './errors';

const ROTA_LOGIN = '/login';
const ROTA_NOVA_SENHA = '/nova-senha';

// O texto de erro que vem na URL é controlado por quem montou o link: nunca exibir.
const LINK_INVALIDO = 'Link inválido ou expirado. Solicite um novo.';

/**
 * Tradução de frontend/Services/authService.js para o mobile.
 * Diferenças: OAuth abre o browser do sistema e volta por deep link (não há
 * window.location), e a recuperação de senha entra no app pelo link do e-mail.
 *
 * Os dois retornos usam PKCE (ver client.ts): o link traz um `code` que só vira
 * sessão com o code verifier gravado neste aparelho quando o fluxo começou.
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
    const redirectTo = Linking.createURL(ROTA_LOGIN);
    if (__DEV__) console.log('[auth] redirectTo (autorize esta URL no Supabase):', redirectTo);

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return err(toAuthError(error));

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') {
      // O detalhe de configuração só ajuda quem desenvolve; o usuário final vê a mensagem curta.
      return err(
        new AuthError(
          __DEV__
            ? `Login com Google não retornou ao app. Verifique se ${redirectTo} está em Authentication → URL Configuration → Redirect URLs no Supabase.`
            : 'O login com Google não foi concluído. Tente novamente.',
        ),
      );
    }

    const trocado = await this.trocarCodigo(res.url);
    if (!trocado.ok) return trocado;

    const usuario = trocado.value ? await this.getUsuarioAtual() : null;
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
      redirectTo: Linking.createURL(ROTA_NOVA_SENHA),
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

  /**
   * Só o link de recuperação de senha passa por aqui. O retorno do OAuth é
   * consumido pelo próprio signInWithGoogle (openAuthSessionAsync); tratá-lo
   * também aqui gastaria duas vezes o mesmo código de uso único.
   */
  async restaurarSessaoDeLink(url: string): Promise<Result<OrigemLink, AuthError>> {
    if (!ehRota(url, ROTA_NOVA_SENHA)) return ok(null);

    const trocado = await this.trocarCodigo(url);
    if (!trocado.ok) return trocado;
    if (!trocado.value) return ok(null);
    return ok(trocado.value === 'recovery' ? 'recuperacao' : 'login');
  }

  /**
   * Troca o `code` do link por uma sessão. Devolve o tipo do redirect
   * ('recovery' para o e-mail de senha) ou null se a URL não trazia código.
   *
   * Tokens soltos na URL (#access_token=…, do fluxo implícito) são ignorados de
   * propósito: aceitá-los deixaria qualquer link colocar o usuário numa conta
   * que não é dele.
   */
  private async trocarCodigo(url: string): Promise<Result<string | null, AuthError>> {
    const params = parseParams(url);
    if (params.error || params.error_description) return err(new AuthError(LINK_INVALIDO));
    if (!params.code) return ok(null);

    const { data, error } = await this.supabase.auth.exchangeCodeForSession(params.code);
    // Sem o code verifier (link que não nasceu neste aparelho) a troca falha aqui.
    if (error) return err(new AuthError(LINK_INVALIDO));
    // O auth-js devolve `redirectType` ('recovery' quando o verifier nasceu no
    // resetPasswordForEmail), mas não o declara no tipo de retorno.
    const { redirectType } = data as { redirectType?: string | null };
    return ok(redirectType ?? 'login');
  }
}

/** Compara só o caminho do link (ignora esquema, host do Expo Go e parâmetros). */
function ehRota(url: string, rota: string): boolean {
  const semBarras = (s: string) => s.replace(/^\/+|\/+$/g, '');
  return semBarras(Linking.parse(url).path ?? '') === semBarras(rota);
}

/** O Supabase devolve os parâmetros no fragmento (#a=b) ou na query (?a=b); lê os dois. */
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
