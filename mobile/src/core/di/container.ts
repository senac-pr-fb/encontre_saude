/**
 * Composição das dependências. É o ÚNICO arquivo fora de `data/` autorizado a
 * importar `data/` — presentation e app/ enxergam apenas este objeto.
 *
 * Cada slice do guia adiciona seus repositórios e use cases aqui:
 *   passo 6  → auth
 *   passo 7  → perfil
 *   passo 8  → farmacias
 *   passo 11 → triagem
 */
import { supabase } from '@data/supabase/client';

export const container = {
  // Exposto para o AuthProvider (onAuthStateChange / startAutoRefresh).
  supabase,
} as const;
