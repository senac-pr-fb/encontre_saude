/**
 * Composição das dependências. É o ÚNICO arquivo fora de `data/` autorizado a
 * importar `data/` — presentation e app/ enxergam apenas este objeto.
 *
 *   passo 6  → auth      (feito)
 *   passo 7  → perfil
 *   passo 8  → farmacias
 *   passo 11 → triagem
 */
import { supabase } from '@data/supabase/client';
import { SupabaseAuthRepository } from '@data/supabase/SupabaseAuthRepository';
import { SignIn, SignUp, SignOut, SignInWithGoogle, RecuperarSenha, AtualizarSenha } from '@domain/usecases/auth';

const authRepo = new SupabaseAuthRepository(supabase);

export const container = {
  auth: {
    /** Usado só pelo AuthProvider (sessão atual, eventos, deep links). */
    repo: authRepo,
    signIn: new SignIn(authRepo),
    signUp: new SignUp(authRepo),
    signOut: new SignOut(authRepo),
    signInWithGoogle: new SignInWithGoogle(authRepo),
    recuperarSenha: new RecuperarSenha(authRepo),
    atualizarSenha: new AtualizarSenha(authRepo),
  },
} as const;
