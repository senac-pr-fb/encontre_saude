# Encontre Saúde

Aplicação de saúde desenvolvida pela turma 202500002 (Projeto Integrador) para auxiliar pessoas novas em Francisco Beltrão ou com dúvidas sobre situações de saúde: triagem de sintomas com IA, primeiros socorros, ações preventivas, mapa de farmácias e ficha de saúde do usuário.

## Organização do repositório

```
encontre_saude/
├── frontend/   # Site (HTML + CSS + Vanilla JS, Vite)
├── mobile/     # App React Native (Expo) — criado no passo 1 do guia
├── services/   # Backend: Supabase (Edge Functions, migrations, policies)
└── docs/       # Documentação de arquitetura e guias
```

Os três projetos compartilham o **mesmo backend Supabase**: mesmas tabelas, mesma autenticação, mesmos usuários. Uma conta criada no site funciona no app e vice-versa.

| Pasta | Stack | Como rodar |
|---|---|---|
| `frontend/` | Vite + supabase-js | `cd frontend && npm install && npm run dev` |
| `mobile/` | Expo + expo-router + TypeScript | `cd mobile && npm install && npx expo start` |
| `services/` | Supabase CLI (Deno para Edge Functions) | `cd services && npx supabase functions serve` |

## Documentação

- [Guia de construção do app mobile](docs/guia-construcao-mobile.md) — passo a passo da conversão do site para React Native com Clean Architecture.
- [frontend/README.md](frontend/README.md) — detalhes do site e dos serviços Supabase.
- [services/README.md](services/README.md) — o que vive no backend e como publicar.

## Variáveis de ambiente

Cada projeto tem seu próprio `.env` (nunca commitado):

| Variável | `frontend/.env` | `mobile/.env` | `services/` (secret) |
|---|---|---|---|
| URL do Supabase | `VITE_SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` | injetada automaticamente |
| Anon key do Supabase | `VITE_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | injetada automaticamente |
| Chave do Gemini | — | — | `GEMINI_API_KEY` |

A anon key é pública por design; a segurança dos dados vem das policies de RLS no banco. A chave do Gemini **só existe no servidor** (ver a seção final do guia).
