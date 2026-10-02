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

Analisa o relato de sintomas com IA (Gemini ou Claude, escolhidos por secret) e grava a consulta no histórico.

**Existe para que a chave do modelo nunca entre num cliente.** O app manda só o texto; a chave, o prompt mestre e a gravação ficam no servidor.

```
app  ──POST { descricao, respostas?, historico_id? } + JWT──▶  triagem
                                   ├── valida o usuário (sem JWT, 401)
                                   ├── lê a ficha (só colunas clínicas) e o histórico (6 meses)
                                   ├── chama o provedor de IA (IA_PROVEDOR)
                                   ├── grava historico_ia + sintomas_atendimento
     ◀──────────────── JSON ───────┘
```

| Arquivo | Papel |
|---|---|
| `index.ts` | Entrada, validação, prompt, decisão de episódio e gravação |
| `schema.ts` | Formato da resposta (Zod): vira o JSON Schema enviado e valida a volta |
| `modelo.ts` | **Única parte que conhece os provedores** (Gemini e Claude), com o mesmo schema e as mesmas mensagens |
| `historico.ts` | Episódios (72 h) e recorrência (6 meses), funções puras |
| `regras.ts` | Entrada, o que da ficha vai ao modelo e o que se aceita da resposta dele (funções puras) |
| `tests/` | Testes em Deno de `historico`, `regras` e `modelo` (com Gemini falso) |

Detalhes que valem saber:

- O cliente Supabase da função usa o **JWT de quem chamou**, então leituras e gravações continuam sujeitas ao RLS — a função não tem privilégio especial.
- **Privacidade**: nome, CPF, telefone e data de nascimento nunca vão ao modelo (a idade sim). Do histórico vão só resumos recentes e contagens. A chamada usa `store: false`. Use uma chave de **projeto com faturamento ativo**: no plano gratuito da API do Gemini, o Google pode usar o conteúdo enviado para melhorar os produtos.
- **Saída estruturada**: o schema Zod vira JSON Schema (`response_format`), e a resposta é validada pelo mesmo schema na volta. Os limites numéricos (nível 1–5) ficam na descrição e no Zod, não no schema enviado.
- **Provedor**: o secret `IA_PROVEDOR` escolhe `gemini` (padrão) ou `anthropic`. Trocar é só `npx supabase secrets set IA_PROVEDOR=anthropic` — sem deploy de código, e o app nunca precisa de rebuild. Cada provedor usa a sua chave (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY`).
- **Claude**: `claude-opus-5-5` com `effort: 'low'` e **fallback em recusa** (`fallbacks: 'default'`, beta `server-side-fallback-2026-07-01`): se um filtro de segurança recusar o relato, o servidor da Anthropic tenta outro modelo adequado antes de a função responder 422. Modelo configurável por `ANTHROPIC_MODEL`.
- **Gemini**: `gemini-3.8-flash` (o Flash mais capaz entre os estáveis) com `thinking_level: 'medium'` — além do nível, o modelo decide se o relato continua um episódio recente e considera a recorrência. Para trocar sem deploy de código: `npx supabase secrets set GEMINI_MODEL=...`. O único acima dele hoje é o `gemini-3.1-pro-preview`, em preview: evitar em produção.
- **Bloqueio**: interação não concluída (`status` diferente de `completed`, ex.: filtro de segurança) responde 422 com orientação, em vez de conteúdo vazio.
- Falha ao gravar o histórico **não** derruba a resposta: a orientação já foi produzida e é o que o usuário precisa.
- Quem manda só `{ descricao }` recebe o formato de sempre; perguntas, episódio e recorrência são campos a mais.

### Publicar

```bash
cd services
npx supabase secrets set GEMINI_API_KEY=...        # e/ou ANTHROPIC_API_KEY=...
npx supabase secrets set IA_PROVEDOR=gemini         # ou anthropic
npx supabase functions deploy triagem
```

Secret gravado com espaço ou vazio conta como ausente e a função responde "Serviço de triagem não configurado" — o mesmo de chave recusada pelo provedor (401/403).

**Logs**: painel do Supabase → Edge Functions → `triagem` → Logs. A função registra o motivo de cada falha (chave recusada, limite, recusa, resposta fora do schema); o CLI atual não tem comando de logs.

`SUPABASE_URL` e `SUPABASE_ANON_KEY` são injetadas automaticamente — não precisam de `secrets set`. Sem a senha do banco, as migrations podem ser aplicadas pelo SQL Editor do painel (são idempotentes).

### Testes e checagem de tipos

```bash
cd services
npm test          # deno test: historico, regras e modelo (Gemini falso, sem rede)
npm run check     # deno check da função inteira
```

O Deno vem como dependência de desenvolvimento (`npm install` basta). Os testes cobrem, entre outros: colunas de identificação fora da ficha enviada, data de nascimento virando idade, episódio indicado pela IA aceito só se for um dos candidatos, recorrência contada por episódio, limites de perguntas e respostas, e o tratamento de bloqueio, JSON inválido e erros HTTP do provedor.

### Testar sem app

```bash
# <JWT> = access_token de um usuário logado (dá para pegar no log do app)
curl -X POST "https://<projeto>.supabase.co/functions/v1/triagem" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"descricao":"dor de cabeça forte há dois dias e febre"}'
```

### Pendente no site (`frontend/`) — não alterado

O site **continua chamando o Gemini direto do navegador** — e a chave dele já expirou, então a triagem do site está fora do ar. Quando alguém for mexer lá:

1. Em `pages/home_page/js/sintomas_ai/api.js`, trocar `genAI.getGenerativeModel(...)` por
   `supabase.functions.invoke('triagem', { body: { descricao } })`.
2. **Remover a chamada a `chatService.saveInteraction`** — a função já grava o histórico. Sem isso, cada triagem vira duas linhas em `historico_ia`.
3. Remover `VITE_API_KEY` do `.env` e `@google/generative-ai` do `package.json`.
4. A chave antiga do Gemini já expirou — não há o que revogar.

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
