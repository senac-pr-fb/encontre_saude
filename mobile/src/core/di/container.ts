/**
 * Composicao das dependencias. E o UNICO arquivo fora de `data/` autorizado a
 * importar `data/` - presentation e app/ enxergam apenas este objeto.
 *
 *   passo 6  -> auth      (feito)
 *   passo 7  -> perfil    (feito)
 *   passo 8  -> farmacias (feito)
 *   passo 10 -> prontuario (feito)
 *   passo 11 -> triagem
 */
import { supabase } from '@data/supabase/client';
import { SupabaseAuthRepository } from '@data/supabase/SupabaseAuthRepository';
import { SupabasePerfilRepository } from '@data/supabase/SupabasePerfilRepository';
import { SignIn, SignUp, SignOut, SignInWithGoogle, RecuperarSenha, AtualizarSenha } from '@domain/usecases/auth';
import { GetPerfil, SavePerfil } from '@domain/usecases/perfil';
import { ListarFarmacias } from '@domain/usecases/farmacias';
import { SalvarConsulta } from '@domain/usecases/prontuario';
import { SupabaseProntuarioRepository } from '@data/supabase/SupabaseProntuarioRepository';
import { criarRascunho, triagemLocal, CHAVE_RASCUNHO_PRONTUARIO } from '@data/local/armazenamentoLocal';
import type { ProntuarioFormInput } from '@domain/usecases/prontuario';
import { FirestoreFarmaciaRepository } from '@data/firestore/FirestoreFarmaciaRepository';

const authRepo = new SupabaseAuthRepository(supabase);
const perfilRepo = new SupabasePerfilRepository(supabase);
// Farmacias vivem no Firestore (catalogo publico), nao no Supabase.
const farmaciaRepo = new FirestoreFarmaciaRepository();
const prontuarioRepo = new SupabaseProntuarioRepository(supabase);

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
  prontuario: {
    salvar: new SalvarConsulta(prontuarioRepo, perfilRepo),
    rascunho: criarRascunho<ProntuarioFormInput>(CHAVE_RASCUNHO_PRONTUARIO),
    triagemLocal,
  },
} as const;
