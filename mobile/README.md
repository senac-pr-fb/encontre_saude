# mobile — Encontre Saúde (Expo)

App React Native do projeto, cliente do mesmo Supabase usado pelo site (`../frontend`).

Passo a passo completo: [docs/guia-construcao-mobile.md](../docs/guia-construcao-mobile.md).

```bash
cp .env.example .env     # preencher com URL e anon key do Supabase
npm install
npx expo start --go      # Expo Go (QR code ou "a" para o emulador)
npm run typecheck
npm run lint
npm test
```

O projeto tem `expo-dev-client`: sem `--go`, o `expo start` procura um **development build** (`npm run build:dev`, via EAS). O Expo Go basta para quase tudo; "Compartilhar arquivo" só funciona no build (ver guia, passo 10), e o login com Google pode exigir o build.

## O que o app faz

- **Navbar:** Home · Socorros · **[Pré-prontuário]** · Prevenção · Farmácias. O botão do meio abre `/documento`; o perfil fica no avatar do canto superior direito.
- **Home (pré-triagem):** a IA (Edge Function `triagem`, em `../services`) orienta, faz até 3 perguntas, sugere atualizações da ficha (só grava com confirmação) e liga relatos do mesmo problema em episódios — com "Não é isso" para desfazer.
- **Contexto de saúde** (`montarContexto` / `useContextoSaude`): ficha + histórico, recalculado a cada mudança. Decide o que o botão do meio mostra: prévia pronta para PDF, só os dados que faltam, ou o caminho para a pré-triagem.
- **Pré-prontuário manual:** opcional, pelo perfil ou por "Editar antes de gerar".

Decisões e fases: [docs/plano-fluxo-documento.md](../docs/plano-fluxo-documento.md). Regras de segurança que não podem regredir: [CLAUDE.md](CLAUDE.md).

## Camadas

```
app/            rotas (expo-router) — telas finas
src/domain/     entidades, contratos de repositório, use cases (auth, perfil, triagem,
                prontuario, contexto…) — sem RN/Expo/Supabase
src/data/       implementações Supabase, DTOs, mappers, conteúdo estático
src/presentation/  tema, componentes, hooks, providers
src/core/       env, Result, container (composição de dependências)
```

Regra: `app → presentation → domain ← data`. Só `core/di/container.ts` importa `data`.
