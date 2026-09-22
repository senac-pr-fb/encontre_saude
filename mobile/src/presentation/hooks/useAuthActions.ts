import { useMutation } from '@tanstack/react-query';
import { container } from '@core/di/container';
import { unwrap } from '@core/utils/result';
import type { CadastroInput, LoginInput, NovaSenhaInput, RecuperarSenhaInput } from '@domain/usecases/auth';

/**
 * Ações de autenticação como mutations. O estado do usuário logado vem do
 * AuthProvider (onAuthStateChange) — estes hooks só disparam e reportam erro.
 */
export function useAuthActions() {
  const { auth } = container;

  const signIn = useMutation({
    mutationFn: (input: LoginInput) => auth.signIn.execute(input).then(unwrap),
  });

  const signUp = useMutation({
    mutationFn: (input: CadastroInput) => auth.signUp.execute(input).then(unwrap),
  });

  const signInWithGoogle = useMutation({
    mutationFn: () => auth.signInWithGoogle.execute().then(unwrap),
  });

  const signOut = useMutation({
    mutationFn: () => auth.signOut.execute().then(unwrap),
  });

  const recuperarSenha = useMutation({
    mutationFn: (input: RecuperarSenhaInput) => auth.recuperarSenha.execute(input).then(unwrap),
  });

  const atualizarSenha = useMutation({
    mutationFn: (input: NovaSenhaInput) => auth.atualizarSenha.execute(input).then(unwrap),
  });

  return { signIn, signUp, signInWithGoogle, signOut, recuperarSenha, atualizarSenha };
}
