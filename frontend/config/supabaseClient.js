import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';
import { createClient } from '@supabase/supabase-js';

if (SUPABASE_URL === "SUA_SUPABASE_URL_AQUI" || SUPABASE_ANON_KEY === "SUA_SUPABASE_ANON_KEY_AQUI") {
    console.warn("Aviso: Variáveis do Supabase não configuradas em config/env.js");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
