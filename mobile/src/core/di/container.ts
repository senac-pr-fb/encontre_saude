/**
 * Composicao das dependencias. E o UNICO arquivo fora de `data/` autorizado a
 * importar `data/` - presentation e app/ enxergam apenas este objeto.
 *
 *   passo 6  -> auth      (feito)
 *   passo 7  -> perfil    (feito)
 *   passo 8  -> farmacias (feito)
 *   passo 11 -> triagem
 */
import { supabase } from '@data/supabase/client';
import { SupabaseAuthRepository } from '@data/supabase/SupabaseAuthRepository';
import { SupabasePerfilRepository } from '@data/supabase/SupabasePerfilRepository';
import { SignIn, SignUp, SignOut, SignInWithGoogle, RecuperarSenha, AtualizarSenha } from '@domain/usecases/auth';
import { GetPerfil, SavePerfil } from '@domain/usecases/perfil';
import { ListarFarmacias } from '@domain/usecases/farmacias';
import { FirestoreFarmaciaRepository } from '@data/firestore/FirestoreFarmaciaRepository';

const authRepo = new SupabaseAuthRepository(supabase);
const perfilRepo = new SupabasePerfilRepository(supabase);
// Farmacias vivem no Firestore (catalogo publico), nao no Supabase.
const farmaciaRepo = new FirestoreFarmaciaRepository();

export const container = {
  auth: {
    /** Usado so pelo AuthProvider (sessao atual, eventos, deep links). */
    repo: authRepo,
    signIn: new SignIn(authRepo),
    signUp: new SignUp(authRepo),
    signOut: new SignOut(authRepo),
    signInWithGoogle: new SignInWithGoogle(authRepo),
    recuperarSenha: new RecuperarSenha(authRepo),
    atualizarSenha: new AtualizarSenha(authRepo),
  },
  perfil: {
    get: new GetPerfil(perfilRepo),
    save: new SavePerfil(perfilRepo),
  },
  farmacias: {
    listar: new ListarFarmacias(farmaciaRepo),
  },
} as const;
