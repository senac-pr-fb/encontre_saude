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

O RLS já está habilitado nas três tabelas, com policies por `user_id`. Confirmado com uma consulta anônima: as tabelas têm linhas e a resposta vem vazia.

## Edge Function `triagem`

Analisa o relato de sintomas com o Gemini e grava a consulta no histórico.

**Existe para que a chave do Gemini nunca entre num cliente.** O app manda só o texto; a chave, o prompt mestre e a gravação ficam no servidor.

```
app / site  ──POST { descricao } + JWT──▶  triagem
                                            ├── valida o usuário (sem JWT, 401)
                                            ├── chama o Gemini com GEMINI_API_KEY
                                            ├── grava historico_ia + sintomas_atendimento
            ◀────────── JSON ───────────────┘
```

Detalhes que valem saber:

- O cliente Supabase da função usa o **JWT de quem chamou**, então as gravações continuam sujeitas ao RLS — a função não tem privilégio especial.
- A resposta do modelo é normalizada antes de gravar: nível preso entre 1 e 5, e os 12 sintomas sempre presentes (o modelo às vezes omite).
- `responseMimeType: 'application/json'` evita as cercas ```` ```json ```` que o site precisa limpar na mão.
- Falha ao gravar o histórico **não** derruba a resposta: a orientação já foi produzida e é o que o usuário precisa.

### Publicar

```bash
cd services
npx supabase functions new triagem          # só na primeira vez; o código já está versionado
npx supabase secrets set GEMINI_API_KEY=<a chave NOVA, depois de revogar a antiga>
npx supabase functions deploy triagem
```

`SUPABASE_URL` e `SUPABASE_ANON_KEY` são injetadas automaticamente — não precisam de `secrets set`.

### Testar sem app

```bash
# <JWT> = access_token de um usuário logado (dá para pegar no log do app)
curl -X POST "https://<projeto>.supabase.co/functions/v1/triagem" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"descricao":"dor de cabeça forte há dois dias e febre"}'
```

### Pendente no site (`frontend/`) — não alterado

O site **continua chamando o Gemini direto do navegador**. Enquanto isso durar, a `VITE_API_KEY` fica exposta no bundle e não pode ser revogada. Quando alguém for mexer lá:

1. Em `pages/home_page/js/sintomas_ai/api.js`, trocar `genAI.getGenerativeModel(...)` por
   `supabase.functions.invoke('triagem', { body: { descricao } })`.
2. **Remover a chamada a `chatService.saveInteraction`** — a função já grava o histórico. Sem isso, cada triagem vira duas linhas em `historico_ia`.
3. Remover `VITE_API_KEY` do `.env` e `@google/generative-ai` do `package.json`.
4. Só então revogar a chave antiga do Gemini no Google AI Studio.

> Enquanto o site não for migrado, não há duplicação: ele salva pelo caminho antigo e o app pelo novo.

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
