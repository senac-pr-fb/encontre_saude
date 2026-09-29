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
  /** Guarda o nome na conta (user_metadata), para o app nao pedir de novo. */
  atualizarNome(nome: string): Promise<Result<void, AuthError>>;
  /** Renovação do token só com o app em primeiro plano (o Supabase recomenda para RN). */
  iniciarAutoRefresh(): void;
  pararAutoRefresh(): void;
  /**
   * Consome o código de um link de recuperação de senha (PKCE). Retorna null se a
   * URL não era desse link ou não trazia código. Links que não nasceram de um
   * pedido feito neste aparelho são recusados.
   */
  restaurarSessaoDeLink(url: string): Promise<Result<OrigemLink, AuthError>>;
}

/**
 * Marca, no aparelho, que a sessão atual veio do link de recuperação e a senha
 * ainda não foi trocada. Enquanto ativa, o app só mostra a tela de nova senha;
 * sobreviver a um reinício impede que fechar o app libere o acesso completo.
 */
export interface RecuperacaoSenhaRepository {
  ativa(): Promise<boolean>;
  marcar(): Promise<void>;
  limpar(): Promise<void>;
}
