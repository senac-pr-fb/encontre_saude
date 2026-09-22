# services — backend Supabase

Tudo que roda **no servidor** do projeto vive aqui. O site (`frontend/`) e o app (`mobile/`) são apenas clientes; qualquer regra que precise de segredo, validação forte ou acesso privilegiado ao banco fica nesta pasta.

```
services/
└── supabase/
    ├── config.toml            # gerado por `supabase init`
    ├── functions/             # Edge Functions (Deno/TypeScript)
    │   └── triagem/           # chama o Gemini com a chave do servidor (ver guia, seção final)
    └── migrations/            # SQL versionado: tabelas, RLS, policies
```

## Tabelas em uso

| Tabela | Descrição | Quem acessa |
|---|---|---|
| `dados_saude` | Ficha de saúde do usuário (1 linha por `user_id`) | dono da linha |
| `historico_ia` | Interações com a triagem de sintomas | dono da linha |
| `sintomas_atendimento` | Sintomas detectados em cada interação (`historico_id`) | dono do histórico |
| ~~`pharmacies`~~ | **Removida** — as farmácias migraram para o Firestore (coleção `pharmacies`) | — |

## Setup (uma vez por máquina)

```bash
cd services
npm init -y
npm i -D supabase
npx supabase login
npx supabase init                 # cria supabase/config.toml
npx supabase link --project-ref <ref>   # o ref está na URL do dashboard
```

## Comandos do dia a dia

```bash
# Nova migration (SQL vazio para você editar)
npx supabase migration new nome_da_migration

# Aplicar migrations no projeto remoto
npx supabase db push

# Nova Edge Function
npx supabase functions new nome

# Rodar função localmente
npx supabase functions serve nome --env-file .env.local

# Publicar função
npx supabase functions deploy nome

# Secrets (só existem no servidor — nunca no app)
npx supabase secrets set GEMINI_API_KEY=...
```

## Regras

1. **Nenhuma chave privada sai desta pasta.** `service_role` e chaves de terceiros (Gemini) entram como *secrets*, nunca em código.
2. **Toda tabela tem RLS ligado.** Uma tabela sem policy é uma tabela pública para quem tiver a anon key.
3. **Mudança de schema é migration.** Nada de alterar tabela só pelo dashboard sem gerar o SQL correspondente aqui.
