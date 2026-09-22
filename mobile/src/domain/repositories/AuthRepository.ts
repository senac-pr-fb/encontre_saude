import type { Usuario } from '../entities/Usuario';
import type { AuthError } from '../errors';
import type { Result } from '@core/utils/result';

export type EventoAuth = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | string;

/** O que um link aberto no app (OAuth, e-mail de recuperação) restaurou. */
export type OrigemLink = 'login' | 'recuperacao' | null;

export interface ResultadoSignUp {
  usuario: Usuario;
  /** true quando o projeto exige confirmação de e-mail e ainda não há sessão. */
  precisaConfirmarEmail: boolean;
}

export interface AuthRepository {
  signIn(email: string, senha: string): Promise<Result<Usuario, AuthError>>;
  signUp(email: string, senha: string): Promise<Result<ResultadoSignUp, AuthError>>;
  signOut(): Promise<Result<void, AuthError>>;
  signInWithGoogle(): Promise<Result<Usuario, AuthError>>;
  getUsuarioAtual(): Promise<Usuario | null>;
  onAuthStateChange(cb: (usuario: Usuario | null, evento: EventoAuth) => void): () => void;
  enviarRecuperacaoSenha(email: string): Promise<Result<void, AuthError>>;
  atualizarSenha(novaSenha: string): Promise<Result<void, AuthError>>;
  /** Renovação do token só com o app em primeiro plano (o Supabase recomenda para RN). */
  iniciarAutoRefresh(): void;
  pararAutoRefresh(): void;
  /** Consome tokens vindos num deep link. Retorna null se a URL não trazia sessão. */
  restaurarSessaoDeLink(url: string): Promise<Result<OrigemLink, AuthError>>;
}
