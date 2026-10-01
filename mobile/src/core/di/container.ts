/**
 * Composicao das dependencias. E o UNICO arquivo fora de `data/` autorizado a
 * importar `data/` - presentation e app/ enxergam apenas este objeto.
 *
 *   passo 6  -> auth      (feito)
 *   passo 7  -> perfil    (feito)
 *   passo 8  -> farmacias (feito)
 *   passo 10 -> prontuario (feito)
 *   passo 11 -> triagem   (feito)
 */
import { supabase } from '@data/supabase/client';
import { SupabaseAuthRepository } from '@data/supabase/SupabaseAuthRepository';
import { SupabasePerfilRepository } from '@data/supabase/SupabasePerfilRepository';
import {
  SignIn,
  SignUp,
  SignOut,
  SignInWithGoogle,
  RecuperarSenha,
  AtualizarSenha,
  LimparDadosLocais,
} from '@domain/usecases/auth';
import type { LimpezaLocalService } from '@domain/services/LimpezaLocalService';
import { GetPerfil, SavePerfil, CompletarObrigatorios, AtualizarFichaClinica } from '@domain/usecases/perfil';
import { ListarFarmacias } from '@domain/usecases/farmacias';
import { SalvarConsulta } from '@domain/usecases/prontuario';
import { RealizarTriagem, GetHistorico, DesvincularEpisodio } from '@domain/usecases/triagem';
import { SupabaseTriagemRepository } from '@data/supabase/SupabaseTriagemRepository';
import { SupabaseProntuarioRepository } from '@data/supabase/SupabaseProntuarioRepository';
import {
  criarRascunho,
  recuperacaoSenhaLocal,
  limparDadosLocais,
  CHAVE_RASCUNHO_PRONTUARIO,
} from '@data/local/armazenamentoLocal';
import type { ProntuarioFormInput } from '@domain/usecases/prontuario';
import { prontuarioPdfService, limparPdfsGerados } from '@data/pdf/prontuarioPdf';
import { PREVENCAO } from '@data/static/prevencao';
import { DICAS_RAPIDAS, PRIMEIROS_SOCORROS } from '@data/static/primeirosSocorros';
import { FirestoreFarmaciaRepository } from '@data/firestore/FirestoreFarmaciaRepository';

const authRepo = new SupabaseAuthRepository(supabase);
const perfilRepo = new SupabasePerfilRepository(supabase);
// Farmacias vivem no Firestore (catalogo publico), nao no Supabase.
const farmaciaRepo = new FirestoreFarmaciaRepository();
const prontuarioRepo = new SupabaseProntuarioRepository(supabase);
const triagemRepo = new SupabaseTriagemRepository(supabase);

// Logout: tudo o que o app deixou no aparelho (AsyncStorage + PDFs) sai junto.
const limpezaLocal: LimpezaLocalService = {
  limpar: async () => {
    await Promise.all([limparDadosLocais(), limparPdfsGerados()]);
  },
};

export const container = {
  auth: {
    /** Usado so pelo AuthProvider (sessao atual, eventos, deep links). */
    repo: authRepo,
    /** Usado so pelo AuthProvider: sessao aberta pelo link de recuperacao de senha. */
    recuperacao: recuperacaoSenhaLocal,
    signIn: new SignIn(authRepo),
    signUp: new SignUp(authRepo),
    signOut: new SignOut(authRepo, limpezaLocal),
    signInWithGoogle: new SignInWithGoogle(authRepo),
    recuperarSenha: new RecuperarSenha(authRepo),
    atualizarSenha: new AtualizarSenha(authRepo, recuperacaoSenhaLocal),
    limparDadosLocais: new LimparDadosLocais(limpezaLocal),
  },
  perfil: {
    get: new GetPerfil(perfilRepo),
    save: new SavePerfil(perfilRepo),
    completarObrigatorios: new CompletarObrigatorios(perfilRepo, authRepo),
    atualizarFichaClinica: new AtualizarFichaClinica(perfilRepo),
  },
  farmacias: {
    listar: new ListarFarmacias(farmaciaRepo),
  },
  prontuario: {
    salvar: new SalvarConsulta(prontuarioRepo, perfilRepo),
    rascunho: criarRascunho<ProntuarioFormInput>(CHAVE_RASCUNHO_PRONTUARIO),
    pdf: prontuarioPdfService,
  },
  /** Conteudo editorial estatico (nao vem de banco). */
  conteudo: {
    prevencao: PREVENCAO,
    primeirosSocorros: PRIMEIROS_SOCORROS,
    dicasRapidas: DICAS_RAPIDAS,
  },
  triagem: {
    realizar: new RealizarTriagem(triagemRepo),
    historico: new GetHistorico(triagemRepo),
    desvincular: new DesvincularEpisodio(triagemRepo),
  },
} as const;
