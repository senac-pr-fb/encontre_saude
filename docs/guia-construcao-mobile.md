# Guia de construção do app mobile (Expo + Clean Architecture)

Este guia descreve, passo a passo, como converter o site `frontend/` em um app React Native na pasta `mobile/`, reaproveitando o backend Supabase já existente.

Cada passo tem um **objetivo**, os **comandos/arquivos** e um **critério de pronto**. Siga em ordem: cada passo assume o anterior.

---

## Sumário

0. [Antes de começar](#0-antes-de-começar)
1. [Criar o projeto Expo](#1-criar-o-projeto-expo)
2. [Estrutura de pastas e camadas](#2-estrutura-de-pastas-e-camadas)
3. [Tema (converter o `config.css`)](#3-tema)
4. [Núcleo: `env`, `Result`, container](#4-núcleo-env-result-container)
5. [Cliente Supabase com armazenamento seguro](#5-cliente-supabase)
6. [Autenticação (primeiro slice completo)](#6-autenticação)
7. [Perfil de saúde](#7-perfil-de-saúde)
8. [Farmácias (mapa + filtros)](#8-farmácias)
9. [Conteúdo estático: primeiros socorros e prevenção](#9-conteúdo-estático)
10. [Pré-prontuário](#10-pré-prontuário)
11. [Triagem de sintomas com IA](#11-triagem-de-sintomas)
12. [Build e distribuição (EAS)](#12-build-e-distribuição)
13. [Variáveis, chaves e segurança (fazer por último)](#13-variáveis-chaves-e-segurança)

Apêndices: [A. Mapa web → mobile](#apêndice-a--mapa-web--mobile) · [B. Stack e versões](#apêndice-b--stack)

---

## 0. Antes de começar

**O que o app é:** um segundo cliente do mesmo backend. Não existe API própria — o Supabase (Auth + Postgres) é o backend, e a única lógica de servidor (chamada ao Gemini) vira uma Edge Function no passo 13.

**O que se reaproveita do site:** a lógica dos `Services/` (auth, perfil, farmácias, histórico), as regras de negócio (níveis de urgência, validações do perfil), os textos de primeiros socorros/prevenção e os tokens visuais do `config.css`.

**O que se reescreve:** toda a camada visual. HTML/DOM não existe em React Native.

**Pré-requisitos na máquina:**

- Node **20.19.4+** e npm (o Expo SDK 57 recusa versões anteriores; `node -v` para conferir)
- App **Expo Go** no celular (iOS ou Android) para testar sem build
- Conta no [expo.dev](https://expo.dev) (necessária só no passo 12)
- Acesso ao projeto Supabase (URL e anon key — pegue em *Project Settings → API*)

**Decisões já tomadas (não rediscutir a cada passo):**

| Decisão | Escolha |
|---|---|
| Framework | Expo (managed) + TypeScript |
| Navegação | `expo-router` (file-based, deep links de graça) |
| Estado de servidor | TanStack Query |
| Estado de auth | React Context (`AuthProvider`) |
| Formulários | `react-hook-form` + `zod` |
| Mapa | `react-native-maps` |
| Sessão | `expo-secure-store` (dados de saúde → LGPD) |
| Farmácias | **Firestore** (coleção `pharmacies`), lido pela API REST — não pelo SDK do Firebase; sem SQLite local |
| Use cases | classes com `execute()`; resto em funções |
| Injeção de dependência | objeto simples em `core/di/container.ts`; sem biblioteca |
| **Login obrigatório** | **Diferente do site**, o app inteiro exige usuário autenticado. Sem sessão, só o grupo `(auth)` é acessível |

---

## 1. Criar o projeto Expo

**Objetivo:** ter um app vazio rodando no celular, com TypeScript e expo-router.

> A pasta `mobile/` **não deve existir** antes deste comando — o `create-expo-app` exige diretório vazio.

```bash
# na raiz do repositório
npx create-expo-app@latest mobile --template blank-typescript
cd mobile

# navegação
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# supabase + storage
npm i @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage expo-secure-store react-native-url-polyfill react-native-get-random-values
npm i aes-js && npm i -D @types/aes-js

# dados, formulários, ícones, fonte
npm i @tanstack/react-query react-hook-form zod @hookform/resolvers
npx expo install @expo/vector-icons expo-font @expo-google-fonts/outfit

# mapa, browser (OAuth), links, splash
npx expo install react-native-maps expo-web-browser expo-splash-screen

# lint (cria eslint.config.js automaticamente)
npx expo install -- --save-dev eslint eslint-config-expo
```

> Se o `npm install` das bibliotecas não-Expo falhar com `ERESOLVE` citando `react-dom`, rode antes
> `npx expo install react-dom` — o npm tenta resolver o peer opcional `react-dom` do Expo para uma
> versão mais nova que o `react` do SDK, e fixá-lo na versão compatível resolve.

Configure o expo-router em `package.json` e `app.json`:

```jsonc
// package.json
{ "main": "expo-router/entry" }
```

```jsonc
// app.json (trecho)
{
  "expo": {
    "name": "Encontre Saúde",
    "slug": "encontre-saude",
    "scheme": "encontresaude",          // deep link — necessário para OAuth e recuperação de senha
    "plugins": ["expo-router", "expo-secure-store", "expo-font"],
    "ios":     { "bundleIdentifier": "br.com.encontresaude.app" },
    "android": { "package": "br.com.encontresaude.app" }
  }
}
```

Apague `App.tsx` e `index.ts` do template (o expo-router assume a entrada), crie `app/_layout.tsx` e `app/index.tsx` mínimos e rode:

```bash
npx expo start
```

Adicione ao `package.json` os scripts `"typecheck": "tsc --noEmit"` e `"lint": "expo lint"` — rode os dois antes de dar qualquer passo por concluído.

**Pronto quando:** o QR code abre o app no Expo Go e mostra a tela `index`; `npm run typecheck` e `npm run lint` passam.

---

## 2. Estrutura de pastas e camadas

**Objetivo:** criar a árvore e o `tsconfig` com paths, antes de qualquer código de feature.

```
mobile/
├── app/                              # expo-router: SÓ rotas e telas finas
│   ├── _layout.tsx                   # Providers (Query, Auth, fontes) + Stack raiz
│   ├── (auth)/                       # grupo sem tabs
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── cadastro.tsx
│   │   └── recuperar-senha.tsx
│   ├── (tabs)/                       # substitui a sidebar do site
│   │   ├── _layout.tsx               # Home · Socorros · Prevenção · Farmácias · Perfil
│   │   ├── index.tsx                 # Home + triagem IA
│   │   ├── primeiros-socorros.tsx
│   │   ├── prevencao.tsx
│   │   ├── farmacias.tsx
│   │   └── perfil.tsx
│   ├── pre-prontuario.tsx            # stack fora das tabs (fluxo multi-step)
│   └── nova-senha.tsx                # visita 2 da recuperação de senha (aberta pelo link do e-mail)
│
├── src/
│   ├── domain/                       # núcleo. ZERO imports de RN, Expo ou Supabase
│   │   ├── entities/                 # Usuario, PerfilSaude, Farmacia, Triagem, NivelUrgencia
│   │   ├── repositories/             # interfaces (contratos)
│   │   ├── usecases/                 # auth/, perfil/, farmacias/, triagem/
│   │   └── errors/                   # DomainError, AuthError, ValidationError, NetworkError
│   │
│   ├── data/                         # implementa as interfaces do domain
│   │   ├── supabase/                 # client.ts + Supabase*Repository.ts
│   │   ├── dto/                      # formato cru das tabelas (snake_case)
│   │   ├── mappers/                  # DTO ↔ entity
│   │   └── static/                   # primeirosSocorros.ts, prevencao.ts
│   │
│   ├── presentation/
│   │   ├── theme/                    # tokens.ts, typography.ts
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Input, PasswordInput, Card, Badge, Loading
│   │   │   └── features/             # TriagemResultCard, FarmaciaCard, PerfilForm…
│   │   ├── hooks/                    # useAuth, usePerfil, useFarmacias, useTriagem
│   │   └── providers/                # AuthProvider.tsx, QueryProvider.tsx
│   │
│   └── core/
│       ├── di/container.ts
│       ├── config/env.ts
│       └── utils/result.ts
│
├── .env                              # gitignored
├── app.json
└── tsconfig.json
```

### A regra de dependência

```
app/ → presentation → domain ← data
                         ↑
                       core
```

- `domain` não importa nada de fora. É TypeScript puro e testável sem Expo.
- `data` importa `domain` (para implementar interfaces) e Supabase.
- `presentation` importa `domain`. **Nunca importa `data`** — recebe as implementações via `container`.
- `app/` importa só `presentation`.

Se isso for respeitado, trocar Supabase por outro backend muda apenas `data/`.

### `tsconfig.json`

```jsonc
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@domain/*": ["./src/domain/*"],
      "@data/*": ["./src/data/*"],
      "@presentation/*": ["./src/presentation/*"],
      "@core/*": ["./src/core/*"]
    }
  }
}
```

> Sem `baseUrl`: o TypeScript 6 (que o SDK 57 instala) marca a opção como obsoleta e falha o `tsc`.
> Com `paths` relativos a `./`, tanto o `tsc` quanto o Metro do Expo resolvem os aliases.

**Pronto quando:** a árvore existe (use `.gitkeep` nas pastas vazias) e `import { x } from '@domain/...'` resolve no editor.

---

## 3. Tema

**Objetivo:** converter `frontend/config/config.css` em tokens TypeScript, para que o app tenha a mesma identidade do site.

```ts
// src/presentation/theme/tokens.ts
export const colors = {
  greenDark: '#2A5C43',
  greenMedium: '#4A8B68',
  greenLight: '#C7DAB7',
  greenAccent: '#E8F5E9',
  background: '#F8F9FA',   // --beige-light
  white: '#FFFFFF',
  grayMedium: '#797979',
  grayLight: '#EBEBEB',
  blackDark: '#1A1A1A',
  text: '#2D3436',
  textLight: '#636E72',
  btnActive: '#1E4230',
  error: '#FF6B6B',
  success: '#2ECC71',
} as const;

export const radius = { sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

// Sombras: RN não tem box-shadow; iOS usa shadow*, Android usa elevation
export const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,  shadowOffset: { width: 0, height: 2 },  elevation: 2 },
  md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },  elevation: 6 },
  lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 32, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
} as const;
```

```ts
// src/presentation/theme/typography.ts
export const fonts = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;
```

Carregue a fonte no `app/_layout.tsx` com `useFonts` de `@expo-google-fonts/outfit` e segure a splash screen até carregar.

Os níveis de urgência da triagem (`niveis` em `sintomas_ai/api.js`) **não** vão para o tema: são regra de negócio e ficam em `domain/entities/NivelUrgencia.ts` (passo 11).

**Pronto quando:** existe um `components/ui/Button.tsx` usando `colors`, `radius` e `fonts`, renderizado na tela `index` com a fonte Outfit.

---

## 4. Núcleo: `env`, `Result`, container

**Objetivo:** ter as três peças transversais que todo slice usa.

### `env.ts` — valida na inicialização, falha cedo

```ts
// src/core/config/env.ts
import { z } from 'zod';

const schema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(), // zod 4
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = schema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  throw new Error('Variáveis de ambiente ausentes. Copie .env.example para .env.');
}

export const env = {
  supabaseUrl: parsed.data.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: parsed.data.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};
```

Crie `.env.example` (commitado) e `.env` (gitignored):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### `result.ts` — substitui o `{ data, error }` do site

```ts
// src/core/utils/result.ts
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok  = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Para usar dentro de queryFn/mutationFn do TanStack Query (que espera throw). */
export function unwrap<T, E extends Error>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw r.error;
}
```

### Erros de domínio

```ts
// src/domain/errors/DomainError.ts
export class DomainError extends Error {
  constructor(message: string, readonly code: string) { super(message); this.name = 'DomainError'; }
}
export class AuthError extends DomainError {
  constructor(message: string) { super(message, 'AUTH'); this.name = 'AuthError'; }
}
export class ValidationError extends DomainError {
  constructor(readonly field: string, message: string) { super(message, 'VALIDATION'); this.name = 'ValidationError'; }
}
export class NetworkError extends DomainError {
  constructor(message = 'Sem conexão') { super(message, 'NETWORK'); this.name = 'NetworkError'; }
}
```

### `container.ts` — monta tudo uma vez

```ts
// src/core/di/container.ts
import { supabase } from '@data/supabase/client';
import { SupabaseAuthRepository } from '@data/supabase/SupabaseAuthRepository';
// ...demais repositórios e use cases

const authRepo = new SupabaseAuthRepository(supabase);

export const container = {
  auth: {
    signIn: new SignIn(authRepo),
    signUp: new SignUp(authRepo),
    signOut: new SignOut(authRepo),
    signInWithGoogle: new SignInWithGoogle(authRepo),
    recuperarSenha: new RecuperarSenha(authRepo),
    atualizarSenha: new AtualizarSenha(authRepo),
  },
  // perfil, farmacias, triagem: preencher nos passos seguintes
};
```

`container.ts` é o **único** arquivo fora de `data/` que importa `data/`. Isso é proposital.

**Pronto quando:** o app inicia com `.env` preenchido e quebra com mensagem clara sem ele.

---

## 5. Cliente Supabase

**Objetivo:** o `createClient` do site adaptado ao mobile: sem URL para detectar sessão, com sessão cifrada em disco.

O site usa o `localStorage` implícito. No mobile, a sessão (JWT + refresh token) precisa de um adapter. Como o app guarda dados de saúde, usamos o padrão recomendado pelo Supabase: a **chave AES fica no SecureStore** (Keychain/Keystore) e o **payload cifrado no AsyncStorage** (o SecureStore tem limite de 2 KB, insuficiente para o JWT).

```ts
// src/data/supabase/client.ts
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import { env } from '@core/config/env';

class LargeSecureStore {
  private async encrypt(key: string, value: string) {
    const encKey = crypto.getRandomValues(new Uint8Array(32));
    const cipher = new aesjs.ModeOfOperation.ctr(encKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(key: string, value: string) {
    const encKeyHex = await SecureStore.getItemAsync(key);
    if (!encKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encKeyHex), new aesjs.Counter(1));
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(key: string) {
    const v = await AsyncStorage.getItem(key);
    return v ? this.decrypt(key, v) : null;
  }
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, await this.encrypt(key, value));
  }
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // não existe URL no mobile
  },
});
```

Adicione também o refresh automático ao voltar do background (o site não precisa disso):

```ts
// no AuthProvider (passo 6)
import { AppState } from 'react-native';
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

**Pronto quando:** `supabase.auth.getSession()` retorna `null` sem erro no app.

---

## 6. Autenticação

**Objetivo:** primeiro slice vertical completo — serve de modelo para todos os outros. Cobre login, cadastro, logout, Google e recuperação de senha, substituindo `frontend/Services/authService.js`.

### Domain

```ts
// src/domain/entities/Usuario.ts
export interface Usuario {
  id: string;
  email: string;
  nome: string | null;   // user_metadata.full_name (vem do Google)
}
```

```ts
// src/domain/repositories/AuthRepository.ts
import type { Usuario } from '../entities/Usuario';
import type { Result } from '@core/utils/result';
import type { AuthError } from '../errors/DomainError';

export interface AuthRepository {
  signIn(email: string, senha: string): Promise<Result<Usuario, AuthError>>;
  signUp(email: string, senha: string): Promise<Result<Usuario, AuthError>>;
  signOut(): Promise<Result<void, AuthError>>;
  signInWithGoogle(): Promise<Result<Usuario, AuthError>>;
  getUsuarioAtual(): Promise<Usuario | null>;
  onAuthStateChange(cb: (usuario: Usuario | null, evento: string) => void): () => void;
  enviarRecuperacaoSenha(email: string): Promise<Result<void, AuthError>>;
  atualizarSenha(novaSenha: string): Promise<Result<void, AuthError>>;
  /** Consome tokens de um deep link (OAuth, e-mail de recuperação). null se a URL não trazia sessão. */
  restaurarSessaoDeLink(url: string): Promise<Result<"login" | "recuperacao" | null, AuthError>>;
  iniciarAutoRefresh(): void;
  pararAutoRefresh(): void;
}
```

Use cases são finos aqui — a validação de e-mail/senha pode ficar num schema `zod` em `domain/usecases/auth/schemas.ts`, reutilizado pelo formulário:

```ts
// src/domain/usecases/auth/SignIn.ts
export class SignIn {
  constructor(private readonly repo: AuthRepository) {}
  execute(email: string, senha: string) {
    return this.repo.signIn(email.trim().toLowerCase(), senha);
  }
}
```

### Data

`SupabaseAuthRepository` é o `authService.js` atual traduzido. Duas partes exigem código específico de mobile:

**Login Google** — no site é `redirectTo: window.location.origin`. No mobile abre o browser do sistema e volta por deep link:

```ts
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

async signInWithGoogle() {
  const redirectTo = Linking.createURL('/auth/callback');   // encontresaude:///auth/callback
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return err(new AuthError(error.message));

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return err(new AuthError('Login cancelado'));

  const params = new URL(res.url.replace('#', '?')).searchParams;
  const { data: sess, error: sessErr } = await this.supabase.auth.setSession({
    access_token: params.get('access_token')!,
    refresh_token: params.get('refresh_token')!,
  });
  if (sessErr || !sess.user) return err(new AuthError(sessErr?.message ?? 'Falha na sessão'));
  return ok(toUsuario(sess.user));
}
```

> No dashboard do Supabase, em *Authentication → URL Configuration → Redirect URLs*, adicione `encontresaude://**` (produção) e a URL que `Linking.createURL` imprimir no Expo Go (formato `exp://…`).

**Recuperação de senha** — no site, o link do e-mail volta para a página e o evento `PASSWORD_RECOVERY` mostra o formulário. No mobile, o link do e-mail abre o app: `resetPasswordForEmail(email, { redirectTo: Linking.createURL('/nova-senha') })`. O `AuthProvider` observa `Linking.useURL()`, chama `restaurarSessaoDeLink(url)` e, se a URL trazia `type=recovery`, faz `router.replace('/nova-senha')`. Essa tela fica no grupo **protegido** (o link já criou uma sessão) — por isso ela não pode estar em `(auth)`, que some assim que há usuário.

### Presentation

```tsx
// src/presentation/providers/AuthProvider.tsx
const AuthContext = createContext<{ usuario: Usuario | null; carregando: boolean }>({ usuario: null, carregando: true });

export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    container.auth.repo.getUsuarioAtual().then((u) => { setUsuario(u); setCarregando(false); });
    return container.auth.repo.onAuthStateChange((u) => setUsuario(u));
  }, []);

  return <AuthContext.Provider value={{ usuario, carregando }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
```

**Proteção de rotas — login obrigatório.** Diferente do site, o app não tem área pública. O gate fica num único lugar, `app/_layout.tsx`, usando `Stack.Protected` do expo-router:

```tsx
const { usuario, carregando } = useAuth();
if (carregando) return null;            // splash continua visível

<Stack screenOptions={{ headerShown: false }}>
  <Stack.Protected guard={!!usuario}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="pre-prontuario" options={{ presentation: 'modal' }} />
  </Stack.Protected>
  <Stack.Protected guard={!usuario}>
    <Stack.Screen name="(auth)" />
  </Stack.Protected>
</Stack>
```

Sem sessão, qualquer rota fora de `(auth)` redireciona para o login; com sessão, `(auth)` fica inacessível e o app cai em `(tabs)/index`. O logout (em Perfil) derruba a sessão e o `onAuthStateChange` faz o redirecionamento sozinho.

Consequências nos passos seguintes: some toda lógica condicional "se logado" que existe no site (sidebar, histórico da triagem, pré-prontuário) — `useAuth().usuario` nunca é `null` dentro de `(tabs)`.

Telas: `(auth)/login.tsx`, `(auth)/cadastro.tsx`, `(auth)/recuperar-senha.tsx`, `nova-senha.tsx` — finas: cada uma monta um formulário de `components/features/auth/` e liga às mutations de `hooks/useAuthActions.ts` (`signIn`, `signUp`, `signInWithGoogle`, `signOut`, `recuperarSenha`, `atualizarSenha`). Os formulários usam `react-hook-form` + os schemas `zod` de `domain/usecases/auth/schemas.ts`; `PasswordInput` com ícone de olho substitui `shared/toggle_senha.js`. Não há `router.push` no sucesso do login: o `Stack.Protected` troca o grupo sozinho quando o `AuthProvider` recebe `SIGNED_IN`.

**Pronto quando:** abrir o app sem sessão cai no login; cria conta, loga, vê o e-mail na aba Perfil; desloga e volta ao login; loga com Google, recupera senha pelo e-mail abrindo o app. Fechar e reabrir o app mantém a sessão.

---

## 7. Perfil de saúde

**Objetivo:** substituir `profileService.js` + `perfil.html`. É o slice mais rico (≈20 campos) e o modelo para os demais.

### Domain

```ts
// src/domain/entities/PerfilSaude.ts
export interface PerfilSaude {
  userId: string;
  idade: number | null;
  peso: number | null;
  altura: number | null;
  sexo: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  telefone: string | null;
  fuma: boolean;
  bebe: boolean;
  alergiaMedicamento: string | null;
  alergias: string | null;
  medicamentosEmUso: string | null;
  doencasPreexistentes: string | null;
  historicoFamiliar: string | null;
  possuiDeficiencia: string | null;
  /** Coluna jsonb `contato_medico_particular` — objeto, não texto. */
  contatoMedico: { nome: string | null; email: string | null; telefone: string | null };
  sinaisVitais: {
    pressaoArterial: string | null;
    frequenciaCardiaca: number | null;
    temperatura: number | null;
    saturacaoOxigenio: number | null;
  };
  observacoes: string | null;
}
```

```ts
// src/domain/repositories/PerfilRepository.ts
export interface PerfilRepository {
  getByUserId(userId: string): Promise<Result<PerfilSaude | null, DomainError>>;
  upsert(perfil: PerfilSaude): Promise<Result<PerfilSaude, DomainError>>;
}
```

`SavePerfil.execute` concentra as validações do site (limites reais de `perfil.html`: idade 0–130, peso 0–300 kg, altura 0,30–3,00 m; mais saturação 0–100%, FC 20–250 bpm, temperatura 30–45 °C). Elas ficam num schema `zod` em `domain/usecases/perfil/perfilSchema.ts` que **valida e converte**: a entrada é sempre texto (é o que um `TextInput` entrega) e a saída já está no formato da entidade. O mesmo schema alimenta o `react-hook-form`, então as mensagens são as mesmas nos dois lugares.

> **Cuidado herdado do site:** lá o formulário preenche 10 campos, mas o `profileService` monta o upsert com 20 — salvar zera alergias, medicamentos, doenças e sinais vitais. No app o formulário cobre todas as colunas, então isso não acontece.

### Data

O **mapper** é o único lugar que conhece a tabela `dados_saude` (snake_case, `CPF` maiúsculo, sinais vitais achatados):

```ts
// src/data/mappers/perfilMapper.ts
export const perfilMapper = {
  toEntity(d: DadosSaudeDTO): PerfilSaude {
    return {
      userId: d.user_id, idade: d.idade, peso: d.peso, altura: d.altura, sexo: d.sexo,
      cpf: d.CPF, dataNascimento: d.data_nascimento, telefone: d.telefone,
      fuma: d.fuma ?? false, bebe: d.bebe ?? false,
      alergiaMedicamento: d.alergia_medicamento, alergias: d.alergias,
      medicamentosEmUso: d.medicamentos_em_uso, doencasPreexistentes: d.doencas_preexistentes,
      historicoFamiliar: d.historico_familiar, possuiDeficiencia: d.possui_deficiencia,
      contatoMedico: lerContato(d.contato_medico_particular),
      sinaisVitais: {
        pressaoArterial: d.pressao_arterial, frequenciaCardiaca: d.frequencia_cardiaca,
        temperatura: d.temperatura, saturacaoOxigenio: d.saturacao_oxigenio,
      },
      observacoes: d.observacoes,
    };
  },
  toDTO(p: PerfilSaude): DadosSaudeDTO { /* inverso */ },
};
```

`SupabasePerfilRepository` é o `profileService.js` traduzido: `select().eq('user_id').single()` tolerando `PGRST116` (sem linha) e `upsert(..., { onConflict: 'user_id' })`.

### Presentation

```ts
// src/presentation/hooks/usePerfil.ts
export function usePerfil() {
  const { usuario } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['perfil', usuario?.id],
    queryFn: () => container.perfil.get.execute(usuario!.id).then(unwrap),
    enabled: !!usuario,
  });

  const salvar = useMutation({
    mutationFn: (p: PerfilSaude) => container.perfil.save.execute(p).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perfil', usuario?.id] }),
  });

  return { perfil: query.data ?? null, carregando: query.isLoading, salvar };
}
```

A tela `app/(tabs)/perfil.tsx` só orquestra: `PerfilForm` recebe `initial`, `onSubmit`, `salvando`. Como são muitos campos, use `ScrollView` com `KeyboardAvoidingView` e agrupe em seções (Dados pessoais · Hábitos · Condições · Sinais vitais), como no site.

**Pronto quando:** abrir Perfil carrega os dados salvos pelo site; salvar no app reflete no site.

---

## 8. Farmácias

**Objetivo:** substituir `create_map.js` (Leaflet) e `create_bairros.js` (lista hardcoded).

### Domain

```ts
// src/domain/entities/Farmacia.ts
export interface Farmacia {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  telefone: string | null;
  horario: string | null;
  site: string | null;
  instagram: string | null;
  tipo: 'Municipal' | 'Privada';   // capitalizado, como vem do Firestore
  lat: number;
  lng: number;
}
```

```ts
// src/domain/repositories/FarmaciaRepository.ts
export interface FarmaciaRepository {
  listar(): Promise<Result<Farmacia[], DomainError>>;
}
```

Filtro é regra pura, sem I/O — vive em um use case e é testável:

```ts
// src/domain/usecases/farmacias/FiltrarFarmacias.ts
export interface FiltroFarmacias { termo: string; bairro: string | null; tipos: TipoFarmacia[] }

export function filtrarFarmacias(lista: Farmacia[], filtro: FiltroFarmacias): Farmacia[] {
  const termo = filtro.termo.trim().toLowerCase();
  return lista.filter((f) => {
    const combinaTexto = termo === '' || f.nome.toLowerCase().includes(termo) || f.bairro.toLowerCase().includes(termo);
    const combinaBairro = filtro.bairro === null || f.bairro === filtro.bairro;
    const combinaTipo = filtro.tipos.includes(f.tipo);
    return combinaTexto && combinaBairro && combinaTipo;
  });
}

export const bairrosDe = (lista: Farmacia[]) =>
  [...new Set(lista.map((f) => f.bairro))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
```

> A lista de bairros **deixa de ser hardcoded**: é derivada das farmácias cadastradas. A lista fixa do site já está desatualizada — tem 12 bairros e classifica *Industrial* como "sem farmácia", mas os dados reais têm 15, incluindo Industrial, Cidade Leste e Jardim Italia.

### Data — Firestore, não Supabase

As farmácias **migraram para o Firebase**: a tabela `pharmacies` do Postgres não existe mais (`PGRST205`), e os dados vivem na coleção `pharmacies` do Firestore.

`FirestoreFarmaciaRepository.listar()` lê essa coleção pela API REST (`GET /v1/projects/{id}/databases/(default)/documents/pharmacies`), decodifica os valores tipados (`stringValue`, `doubleValue`, `geoPointValue`, `nullValue`) e ordena por nome.

**Por que REST e não o SDK do Firebase:** o catálogo é público e somente leitura. O SDK acrescentaria ~200 KB ao bundle, um segundo runtime de autenticação e os problemas conhecidos de long-polling em React Native, sem trazer nada necessário — o cache fica por conta do TanStack Query. Se um dia houver escrita ou tempo real, troca-se a implementação dentro de `data/`, sem tocar em mais nada.

**Formato real dos 53 documentos** (levantado em 22/09/2026):

| Observação | Consequência no mapper |
|---|---|
| Todos têm `lat`/`lng` **e** um `location` geopoint, sempre coerentes | Usa `lat`/`lng`; o geopoint fica de reserva |
| `tipo` vem capitalizado: `"Privada"` (46), `"Municipal"` (7) | Normaliza sem diferenciar maiúsculas — o site compara em minúsculas |
| `instagram` é `null` em todos os 53; `site` só em 5 | A UI só renderiza o que existe |
| Um documento não tem `endereco` | `endereco` é `string \| null` na entidade |

**Regras do Firestore.** Sem elas a leitura é negada com `PERMISSION_DENIED`. Atenção: o app autentica no **Supabase**, então uma regra `if request.auth != null` nunca passaria — para o Firestore o usuário é sempre anônimo.

```js
match /pharmacies/{doc} {
  allow read: if true;     // catálogo público
  allow write: if false;   // só pelo Console ou Admin SDK
}
```

> **O site ficou quebrado nessa migração:** `frontend/Services/pharmacyService.js` ainda consulta a tabela do Supabase e, como trata o erro devolvendo `[]`, a página de farmácias exibe mapa e lista vazios sem nenhum aviso.

### Presentation

- `useFarmacias()` — `useQuery(['farmacias'])` com `staleTime: 1h` (dados mudam raramente). Opcional: `persistQueryClient` com AsyncStorage para ler a última lista offline.
- `FarmaciasMap.tsx` — `react-native-maps` com `MapView` centrado em `[-26.0815, -53.0556]` (Francisco Beltrão), um `Marker` por farmácia, `Callout` com nome/endereço. Clique no marcador seleciona o card; clique no card faz `mapRef.animateToRegion`.
- `FarmaciaCard.tsx` — nome, endereço, telefone (`Linking.openURL('tel:…')`), site, Instagram, horário, bairro, botão **Ver rota** → `Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=lat,lng')`.
- Filtros: `TextInput` de busca, `Picker`/`ActionSheet` de bairro, dois `Switch` (municipal/privada) — mesmo comportamento do site (ambos ligados por padrão; ambos desligados = lista vazia).

> `react-native-maps` no Android exige uma chave do Google Maps em `app.json` (`android.config.googleMaps.apiKey`). Essa chave é pública por natureza — restrinja-a ao package do app no console do Google Cloud.

**Pronto quando:** o mapa mostra as farmácias do banco; busca, bairro e tipo filtram lista e marcadores em sincronia.

---

## 9. Conteúdo estático

**Objetivo:** substituir `primeiro_socorros_pages/` e `prevencao_pages/`, que não tocam o banco.

Não precisa de use case nem repositório: é conteúdo, não dado. Se um dia virar tabela, aí sim cria-se um `ConteudoRepository` e só a origem muda.

### O problema: o texto está em HTML dentro do JS

No site, cada tópico de primeiros socorros é uma string com `<p>`, `<b>` e traços fazendo papel de marcador:

```js
content: `
  <b><p>1. Engasgamento leve </b>
  <p><b>-</b> Pedir para a pessoa tossir 5 vezes com força;
`
```

React Native não renderiza HTML, e trazer uma biblioteca para isso seria pagar caro por um texto que já conhecemos. A conversão certa é para **dados estruturados**:

```ts
// src/domain/entities/Conteudo.ts
export type BlocoConteudo =
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'paragrafo'; texto: string; destaque?: boolean }
  | { tipo: 'lista'; itens: string[] };

export interface TopicoSocorro { id: string; titulo: string; blocos: BlocoConteudo[]; video: string | null }
export interface TopicoPrevencao { id: string; titulo: string; imagem: string | null; paragrafos: string[] }
```

### A extração

Converter 500 linhas à mão é lento e erra. Um script de uso único resolve: ele lê os arquivos do site, quebra o HTML em pedaços por `<p>`, classifica cada um (item de lista quando começa com `<b>-</b>`, subtítulo quando é `1. Texto`, parágrafo no resto), agrupa itens consecutivos numa `lista` e escreve os `.ts` de `src/data/static/`. Rode no scratchpad, confira o resultado e descarte o script.

Resultado: **9 tópicos** de primeiros socorros (cada um com seu vídeo), **10 dicas** rotativas, **6 tópicos** de prevenção.

> Duas armadilhas na extração: a regex das dicas pega strings do resto do arquivo se não limitar ao trecho do array; e o texto de primeiros socorros cita "como mostra o passo 1 da imagem", mas essas imagens não existem no repositório — as frases ficaram como estão, já que descrevem o passo em palavras.

### Telas

- **Primeiros socorros:** acordeão por tópico (`LayoutAnimation` para a expansão), ícone por assunto (`lungs`, `heart-pulse`, `fire`…), a dica rotativa do site (troca a cada 10 s, igual ao `setInterval` do original) e uma faixa de **telefones de emergência** que liga direto — SAMU 192, Bombeiros 193 e CIAT 0800 722 6001, que no site aparecem só no meio do texto.
- **Vídeos:** os tópicos têm vídeos do YouTube, que no site são `<iframe>` e aqui viram `react-native-webview` (já incluída no Expo Go, dispensa development build). O campo `video` guarda só o id; a URL de embed se monta na hora. A WebView só é criada **depois do toque no play** — nove WebViews vivas numa lista consumiriam memória à toa, já que o acordeão permite abrir vários tópicos.

> **Duas armadilhas do embed.** Carregar a URL do embed direto em `source={{ uri }}` faz o YouTube responder *"Video player configuration error"*: a WebView não manda referer, e o player exige origem válida. A saída é servir o `<iframe>` como HTML com `baseUrl: 'https://www.youtube.com'`. E como esse erro é renderizado **dentro** do iframe, ele não dispara `onError` — por isso o card mantém sempre um link "Abrir no YouTube" visível, em vez de depender só do tratamento de falha.

> **Um vídeo do site está morto:** `JttAYDeuSyg` (Transporte de vítimas) foi removido do YouTube — o oEmbed responde 404. Ficou como `video: null` até surgir um link novo; no site ele ainda aparece como player quebrado. Vale conferir os demais de tempos em tempos com `https://www.youtube.com/oembed?url=...&format=json`.
- **Prevenção:** mesmo acordeão, com a imagem de capa de cada tópico. As imagens são links externos (Google/gstatic) herdados do site: se falharem, o `onError` esconde a capa e o texto continua.
- Um aviso no rodapé deixa claro que o conteúdo é informativo e não substitui atendimento.

**Pronto quando:** as duas abas mostram o mesmo conteúdo do site, os acordeões abrem e fecham, os vídeos tocam embutidos e os botões de emergência abrem o discador.

---

## 10. Pré-prontuário

**Objetivo:** substituir o formulário de 4 etapas de `pre_prontuario.js` (683 linhas, o maior arquivo do site).

### As etapas

| Etapa | Campos | Validação (a mesma do site) |
|---|---|---|
| 1. Dados pessoais | nome, nascimento, CPF, sexo, telefone | nome ≥ 3, CPF com 11 dígitos, telefone ≥ 10 dígitos, sexo obrigatório |
| 2. Sintomas | queixa principal, há quanto tempo, 12 sintomas | queixa ≥ 10 caracteres |
| 3. Histórico clínico | alergias, medicamentos, doenças, histórico familiar + 6 sinais vitais | limites iguais aos do perfil |
| 4. Revisão | resumo do que será enviado | — |

Um único `react-hook-form` cobre as quatro; `trigger(CAMPOS_POR_ETAPA[n])` valida só os campos da etapa antes de avançar. Os 12 sintomas são a lista fixa que casa com as colunas de `sintomas_atendimento`.

> A data de nascimento ganhou validação real: o site só verifica se o campo está preenchido, aceitando `31/02/2001` ou uma data no futuro.

### As automações do formulário

1. **Pré-preenchimento** pela ficha de saúde (`usePerfil`) e pelo nome da conta (`useAuth`).
2. **Nome do paciente:** não existe coluna para ele em `dados_saude` — ele pertence à conta. Quem se cadastrou por e-mail não tem nome (só o login Google traz um), então o app guarda em `user_metadata` o nome digitado no prontuário, e nas próximas vezes ele já vem preenchido. O site pede o nome toda vez.
3. **Rascunho automático:** o site grava no `localStorage` a cada tecla e restaura ao voltar; no app, AsyncStorage. Num formulário de 4 etapas no celular — onde o app pode ir para segundo plano a qualquer momento — isso deixa de ser conveniência e vira necessidade.
4. **Ponte triagem → prontuário:** a última triagem da IA fica guardada por 20 minutos e preenche a queixa principal com relato, nível e recomendação. É a melhor ideia do site e passa despercebida. Quem escreve é o passo 11 (`triagemLocal.registrar`); o prontuário só lê.

Precedência: **rascunho > perfil**, e a triagem só entra se a queixa ainda estiver vazia. Quem digitou algo e saiu do app não quer o próprio texto substituído pelo cadastro.

### Ao concluir

```
salvarConsulta  →  historico_ia + sintomas_atendimento (dados_clinicos em jsonb)
sincronizar     →  dados_saude, preservando o que o formulário não cobre
gerar PDF       →  expo-print
compartilhar    →  expo-sharing
```

> **O site apaga dados aqui também:** ao gerar o PDF ele chama `profileService.saveProfile` com apenas os campos do formulário, zerando o resto da ficha. O `SalvarConsulta` carrega o perfil atual e sobrescreve só o que foi informado.

**PDF: `expo-print` em vez de jsPDF.** O site desenha o documento coordenada a coordenada (~130 linhas de `doc.text(x, y)`, com controle manual de quebra de página). No app, o documento é HTML e o motor de impressão do sistema gera o A4: o layout vira CSS, a paginação é automática e mudar o visual não exige recalcular posições.

**Entrega: duas saídas reais, não canais simulados.** A etapa 4 do site pede e-mail ou WhatsApp, valida o formato — e então apenas mostra um toast dizendo "envio simulado". Replicar isso criaria expectativa falsa. O app oferece:

| Botão | Como funciona | Onde funciona |
|---|---|---|
| **Salvar ou imprimir PDF** | `Print.printAsync` abre o diálogo do sistema, com "Salvar como PDF" no Android e a folha de compartilhamento no iOS | Expo Go **e** build |
| **Compartilhar arquivo** | `Sharing.shareAsync` abre o menu nativo (e-mail, WhatsApp, salvar) | Só em build |

> **O arquivo impresso é ilegível no Expo Go.** O `printToFileAsync` grava em `cache/Print/`, **fora** da sandbox do app quando se roda no Expo Go — tanto a API de arquivos quanto o compartilhamento recusam lê-lo (`isn.t readable`, `Not allowed to read file under given URL`). A saída é não ler a origem: pedir `base64: true` e gravar o PDF no `documentDirectory` com `writeAsStringAsync`. Num build isso não seria necessário, mas não custa nada e dá ao arquivo um nome decente — que é o que o destinatário vê.

> A impressão continua sendo a ação principal por não tocar o sistema de arquivos: o HTML vai direto para o motor de impressão. Rodando no Expo Go, a tela explica em uma linha por que o compartilhamento pode falhar (`ehExpoGo`, de `core/config/ambiente.ts`).

> Se um dia o envio automático por e-mail for necessário, ele é uma Edge Function com o PDF anexado — não um campo de formulário no app.

**Pronto quando:** as 4 etapas navegam e validam, o rascunho sobrevive a fechar o app, o PDF abre no visualizador do sistema e a consulta aparece no histórico do Supabase.

---

## 11. Triagem de sintomas

**Objetivo:** substituir `sintomas_ai/api.js` + `sintomas.js` na Home.

> **Depende da Edge Function `triagem` publicada.** O código dela está em `services/supabase/functions/triagem/`; o deploy e os detalhes estão no [README de services](../services/README.md).

### Domain

```ts
// src/domain/entities/Triagem.ts   (o objeto `niveis` do api.js, ampliado)
export const NIVEIS = {
  1: { cor: '#5EA7FF', texto: 'Não Urgente',   resumo: '…', conduta: '…' },
  2: { cor: '#ABFB4F', texto: 'Pouco Urgente', resumo: '…', conduta: '…' },
  3: { cor: '#FFEA00', texto: 'Urgente',       resumo: '…', conduta: '…' },
  4: { cor: '#FF771C', texto: 'Muito Urgente', resumo: '…', conduta: '…' },
  5: { cor: '#D51717', texto: 'Emergência',    resumo: '…', conduta: '…' },
} as const;
export type NivelUrgencia = keyof typeof NIVEIS;
```

> No site esses dados estão em **dois lugares** que precisam ser mantidos em sincronia na mão: as cores em `api.js` e os textos em `create_feedback.js`. Aqui viram um objeto só.

```ts
// Os sintomas são a lista de colunas, não 12 booleanos soltos:
// reaproveita SINTOMAS de PreProntuario e casa com `sintomas_atendimento`.
export interface Triagem {
  nivel: NivelUrgencia;
  resumo: string;
  recomendacao: string;
  primeirosSocorros: string;
  unidadeRecomendada: string;
  sintomas: ColunaSintoma[];
}

export interface InteracaoHistorico {
  id: string;
  quando: string;
  descricao: string;
  /** null quando o registro veio do pré-prontuário, que não passa pela IA. */
  triagem: Triagem | null;
  sintomas: ColunaSintoma[];
}
```

```ts
// src/domain/repositories/TriagemRepository.ts
export interface TriagemRepository {
  analisar(descricao: string): Promise<Result<Triagem, DomainError>>;
  historico(userId: string): Promise<Result<InteracaoHistorico[], DomainError>>;
}
```

`RealizarTriagem.execute(descricao)` valida o tamanho (10 a 2000 caracteres), delega — e, no sucesso, chama `triagemLocal.registrar()`. **É esse registro que alimenta a ponte para o pré-prontuário** (passo 10): a triagem fica guardada por 20 minutos e preenche a queixa principal.

### Data

```ts
// src/data/supabase/SupabaseTriagemRepository.ts
async analisar(descricao: string) {
  const { data, error } = await this.supabase.functions.invoke('triagem', { body: { descricao } });
  if (error) return err(toDomainError(error));
  return ok(triagemMapper.toEntity(data));
}
```

O `supabase-js` envia o JWT do usuário automaticamente. O prompt mestre, o parse do JSON e a chave do Gemini **não existem no app** — vivem na Edge Function.

`historico()` = `from('historico_ia').select('*, sintomas_atendimento(*)').eq('user_id', …).order('created_at', { ascending: false })`. O cache em `localStorage` do site deixa de existir: o histórico vem do banco (é o TanStack Query que cacheia).

### Presentation

- `useTriagem()` — `useMutation` para analisar + `useQuery(['historico', userId])`. Como a Edge Function grava o histórico, basta invalidar a query no sucesso.
- **Home:** aviso médico, campo de texto com contador, `ResultadoTriagem` com a faixa colorida do nível, e o histórico embaixo.
- **Legenda dos 5 níveis:** no site fica sempre visível num painel lateral; no celular não cabe, então virou acordeão fechado por padrão.
- **Nível 5:** aparece um botão de **ligar para o SAMU** acima do resultado. Numa emergência, ninguém deveria precisar ler três parágrafos para achar o telefone.
- **Histórico unificado:** a tabela `historico_ia` recebe tanto triagens quanto pré-prontuários. Os do prontuário têm texto fixo no lugar do JSON da IA, então `triagem` fica `null` e o item aparece com selo próprio, em vez de quebrar o parse.

> Duas diferenças de contraste que importam: as cores dos níveis 2 e 3 (verde-limão e amarelo) são claras demais para texto branco — o `ResultadoTriagem` inverte para texto escuro nesses dois.

**Pronto quando:** descrever sintomas devolve o card colorido, a interação aparece no histórico e em `historico_ia`, e abrir o pré-prontuário em seguida traz a queixa preenchida.

---

## 12. Build e distribuição

**Objetivo:** gerar APK/AAB e build iOS sem máquina Mac.

```bash
npm i -g eas-cli
eas login
eas build:configure          # cria eas.json

# variáveis de ambiente do build (substitui o .env local)
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co --visibility plaintext
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ... --visibility plaintext

# APK para testar em Android sem loja
eas build -p android --profile preview

# builds de loja
eas build -p android --profile production
eas build -p ios --profile production
```

`eas.json` sugerido:

```jsonc
{
  "build": {
    "preview":    { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "autoIncrement": true }
  }
}
```

**Pronto quando:** o APK `preview` instala num Android e o fluxo completo (login → perfil → farmácias → triagem) funciona sem o Expo Go.

---

## 13. Variáveis, chaves e segurança

> Este passo fica por último de propósito: ele corrige um problema que já existe no site e é compartilhado com o app. Nada dos passos 1–12 depende dele, exceto a triagem real (passo 11).

### 13.1 O princípio

**Tudo que entra no bundle do app é extraível** — `VITE_*`, `EXPO_PUBLIC_*`, ofuscação, nada disso esconde uma string. Um APK descompactado ou o `dist/` do Vite entregam a chave em segundos. Logo:

| Chave | Pode ir no app? | Por quê |
|---|---|---|
| `SUPABASE_URL` | Sim | Pública por design |
| `SUPABASE_ANON_KEY` | Sim, **com RLS ligado** | Só dá o acesso que as policies permitem |
| `service_role` | **Nunca** | Ignora RLS |
| Chave do Gemini | **Nunca** | Sem noção de usuário; quem tiver usa sua cota |

### 13.2 Situação atual no `frontend/`

A chave do Gemini (`VITE_API_KEY`) está embutida no bundle em `frontend/dist/assets/*.js`, e `dist/` está **commitado no git**. A chave já é pública no repositório.

Correção, nesta ordem:

1. **Revogar** a chave atual no Google AI Studio e gerar outra. (Ela está no histórico do git — trocar é obrigatório.)
2. Adicionar `dist` ao `.gitignore` e rodar `git rm -r --cached frontend/dist`. Vercel/Netlify/GitHub Pages fazem o build; `dist/` não precisa estar versionado.
3. Ativar RLS (13.3).
4. Criar a Edge Function (13.4) e apontar o site para ela.
5. Remover `VITE_API_KEY` do `frontend/.env` e `@google/generative-ai` do `frontend/package.json`.

### 13.3 RLS — o que protege o banco de verdade

**Já configurado neste projeto:** as três tabelas têm RLS habilitado com policies por `user_id`. Não mexa nelas sem necessidade.

Verificação rápida, sem abrir o dashboard — uma leitura anônima de uma tabela que tem linhas:

```bash
curl -s "$SUPABASE_URL/rest/v1/dados_saude?select=*&limit=1" -H "apikey: $ANON_KEY"
# []      → RLS filtrando, como deve ser
# [{...}] → RLS desligado: corrigir antes de qualquer publicação
```

A forma das policies, para referência:

```sql
create policy "dono do perfil" on dados_saude
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sintomas_atendimento não tem user_id: valida pelo histórico pai
create policy "dono dos sintomas" on sintomas_atendimento
  for all using (
    exists (select 1 from historico_ia h where h.id = historico_id and h.user_id = auth.uid())
  );
```

Isso é o que torna a anon key segura no bundle: ela só dá o acesso que as policies permitem.

### 13.4 Edge Function `triagem`

**Já implementada** em `services/supabase/functions/triagem/index.ts`. O README de `services/` tem o deploy, o fluxo e como testar com `curl`.

```
app (ou site)                  Supabase                          Google
─────────────                  ──────────────────────────────    ──────
functions.invoke('triagem') ──▶ 1. valida o JWT (sem ele, 401)
   com o JWT do usuário         2. lê GEMINI_API_KEY do secret ──▶ Gemini
                                3. normaliza e grava o histórico ◀─ resposta
        ◀── JSON ──────────     4. devolve o resultado
```

```bash
cd services
npx supabase secrets set GEMINI_API_KEY=<a chave NOVA>
npx supabase functions deploy triagem
```

`SUPABASE_URL` e `SUPABASE_ANON_KEY` são injetadas automaticamente. O cliente dentro da função usa o **JWT de quem chamou**, então as gravações continuam sujeitas ao RLS — a função não tem privilégio especial.

### 13.5 Pendente no site (`frontend/`)

O site **ainda chama o Gemini direto do navegador**, então a `VITE_API_KEY` continua no bundle e não pode ser revogada. Quando alguém for mexer lá:

1. Em `pages/home_page/js/sintomas_ai/api.js`, trocar `genAI.getGenerativeModel(...)` por `supabase.functions.invoke('triagem', { body: { descricao } })`.
2. **Remover a chamada a `chatService.saveInteraction`** — a função já grava o histórico. Sem isso, cada triagem vira duas linhas em `historico_ia`.
3. Remover `VITE_API_KEY` do `.env` e `@google/generative-ai` do `package.json`.
4. Só então revogar a chave antiga no Google AI Studio.

> Enquanto o site não migrar, não há duplicação: ele salva pelo caminho antigo, o app pelo novo.

### 13.6 Checklist final

- [x] RLS ativo nas três tabelas, com policies por `user_id`
- [x] `dist/` fora do git e no `.gitignore`
- [x] Edge Function `triagem` escrita, com a chave só no servidor
- [x] `mobile/.env` contém apenas valores públicos (Supabase + Firebase)
- [x] Regras do Firestore: leitura pública em `pharmacies`, escrita bloqueada
- [ ] `GEMINI_API_KEY` cadastrada como secret e a função publicada
- [ ] Site migrado para a Edge Function (seção 13.5)
- [ ] **Chave antiga do Gemini revogada** — só depois do item acima
- [ ] `@google/generative-ai` e `VITE_API_KEY` removidos do `frontend/`
- [ ] Redirect URLs do Supabase incluem `encontresaude://**`

---

## Apêndice A — Mapa web → mobile

| `frontend/` | `mobile/` |
|---|---|
| `Services/authService.js` | `data/supabase/SupabaseAuthRepository.ts` + `domain/usecases/auth/*` |
| `Services/profileService.js` | `SupabasePerfilRepository` + `GetPerfil`/`SavePerfil` + `mappers/perfilMapper.ts` |
| `Services/chatService.js` | `SupabaseTriagemRepository.historico()`; a gravação vai para a Edge Function |
| `Services/pharmacyService.js` | `FirestoreFarmaciaRepository` + `ListarFarmacias` (os dados migraram para o Firestore) |
| `config/env.js` | `core/config/env.ts` (validado com zod) |
| `config/supabaseClient.js` | `data/supabase/client.ts` (SecureStore adapter) |
| `config/config.css` | `presentation/theme/tokens.ts` + `typography.ts` |
| `config/routes/routes.js` | desaparece — expo-router usa o sistema de arquivos |
| `shared/sidebar.js` | `app/(tabs)/_layout.tsx` |
| `shared/footer.js` | tela "Sobre" ou rodapé da aba Perfil |
| `shared/toggle_senha.js` | `components/ui/PasswordInput.tsx` |
| `shared/telegram_widget.js` | `components/ui/TelegramFab.tsx` (`Linking.openURL`) |
| `sintomas_ai/api.js` — prompt, parse, chave | Edge Function `triagem` em `services/` |
| `sintomas_ai/api.js` — `niveis` + `create_feedback.js` | `domain/entities/Triagem.ts` (`NIVEIS`, cor e texto juntos) |
| `sintomas_ai/api.js` — `localStorage` de sessões | removido; histórico vem do banco |
| `farmacias_pages/js/create_map.js` | `components/features/FarmaciasMap.tsx` (`react-native-maps`) |
| `farmacias_pages/js/create_bairros.js` | `bairrosDe()` derivado da lista + `BairroPicker` |
| `primeiro_socorros_pages/js/dicas.js` + `init_primeiros_socorros.js` (HTML em string) | `data/static/primeirosSocorros.ts` — blocos tipados, renderizados por `components/features/conteudo/` |
| `prevencao_pages/js/info_prevencao.js` | `data/static/prevencao.ts` |
| `<iframe>` do YouTube em `init_primeiros_socorros.js` | `components/features/conteudo/VideoYouTube.tsx` (`react-native-webview`) |
| `pre_prontuario_pages/pre_prontuario.js` | `app/pre-prontuario.tsx` + `PreProntuarioForm` |
| `window.print()` / jsPDF | `expo-print` (HTML → PDF) + `expo-sharing` |
| `window.location.href = …` | `router.push()` / `<Redirect>` |
| `localStorage` | `AsyncStorage` (dados comuns) / `SecureStore` (sessão) |
| Font Awesome CDN | `FontAwesome6` de `@expo/vector-icons` |
| Fonte Outfit (Google Fonts CSS) | `@expo-google-fonts/outfit` |

## Apêndice B — Stack

| Pacote | Papel |
|---|---|
| `expo` (SDK 52+) | Runtime e toolchain |
| `expo-router` | Navegação file-based, deep links |
| `@supabase/supabase-js` | Auth + Postgres + Edge Functions |
| `expo-secure-store` + `aes-js` | Sessão cifrada |
| `@tanstack/react-query` | Cache e estado de servidor |
| `react-hook-form` + `zod` | Formulários e validação (schema compartilhado com `domain`) |
| `react-native-maps` | Mapa de farmácias |
| `expo-web-browser` + `expo-linking` | OAuth Google, recuperação de senha |
| `@expo/vector-icons` | Ícones (FontAwesome6) |
| `@expo-google-fonts/outfit` | Fonte do site |
| `expo-sharing` | Compartilhar pré-prontuário |
| `expo-print` | PDF do pré-prontuário (substitui o jsPDF do site) |
| `react-native-webview` | Vídeos do YouTube nos primeiros socorros |
| `jest` + `@testing-library/react-native` | Testes (`domain/` testa sem mocks) |
