# mobile — Encontre Saúde (Expo)

App React Native do projeto, cliente do mesmo Supabase usado pelo site (`../frontend`).

Passo a passo completo: [docs/guia-construcao-mobile.md](../docs/guia-construcao-mobile.md).

```bash
cp .env.example .env     # preencher com URL e anon key do Supabase
npm install
npx expo start           # abrir no Expo Go pelo QR code
npm run typecheck
npm run lint
```

## Camadas

```
app/            rotas (expo-router) — telas finas
src/domain/     entidades, contratos de repositório, use cases — sem RN/Expo/Supabase
src/data/       implementações Supabase, DTOs, mappers, conteúdo estático
src/presentation/  tema, componentes, hooks, providers
src/core/       env, Result, container (composição de dependências)
```

Regra: `app → presentation → domain ← data`. Só `core/di/container.ts` importa `data`.
