import { z } from 'zod';

// Só variáveis EXPO_PUBLIC_* entram no bundle — e por isso são públicas.
// Nunca adicionar aqui chaves de terceiros (Gemini) ou a service_role.
const schema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = schema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  throw new Error(
    'Variáveis de ambiente ausentes ou inválidas. Copie .env.example para .env e preencha.\n' +
      parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n'),
  );
}

export const env = {
  supabaseUrl: parsed.data.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
} as const;
