@AGENTS.md

# Correções de segurança (auditoria de 29/09/2026)

Registro das falhas corrigidas na pasta `mobile/`: como estava, o que mudou e a
regra que precisa ser mantida para a falha não voltar. Os números seguem o
relatório da auditoria. Itens do relatório que não aparecem aqui ainda **não**
foram tratados.

## 1 e 3 — Sessão por deep link e interceptação de tokens (Crítica / Alta)

**Como estava:** o cliente Supabase usava o fluxo padrão `implicit`. O retorno do
login com Google e o link do e-mail de recuperação traziam `access_token` e
`refresh_token` na URL, e o `AuthProvider` passava **qualquer** URL
`encontresaude://…` para `setSession`. Com isso:
- um link forjado (WhatsApp, QR code, site) colocava a vítima na conta do
  atacante, e os dados de saúde que ela preenchesse iam para essa conta;
- outro app registrado com o esquema `encontresaude://` podia receber os tokens.

**O que foi feito:**
- `src/data/supabase/client.ts`: `flowType: 'pkce'`. O link traz só um `code`
  de uso único, que só vira sessão com o code verifier gravado no aparelho que
  iniciou o fluxo.
- `src/data/supabase/SupabaseAuthRepository.ts`:
  - `setSession` com tokens da URL foi removido. Links com `#access_token=…` são ignorados;
  - o método privado `trocarCodigo()` chama `exchangeCodeForSession`;
  - `restaurarSessaoDeLink()` só aceita o link de `/nova-senha`, porque o
    retorno do OAuth é consumido pelo próprio `signInWithGoogle`. Processá-lo
    duas vezes gastaria o código de uso único;
  - a recuperação é identificada pelo `redirectType === 'recovery'` devolvido
    pelo auth-js (o campo existe em tempo de execução, mas não no tipo).

**Não regredir:**
- Nunca voltar a aceitar tokens vindos de URL.
- Todo fluxo novo que volte por deep link (magic link, confirmação de e-mail
  no app) deve usar código PKCE.

**Efeito colateral esperado:** o link de recuperação só funciona no aparelho
onde foi pedido, e pedir de novo invalida o link anterior.

## 4 e 6 — Dados locais e PDFs que sobreviviam ao logout (Alta)

**Como estava:** o `SignOut` só encerrava a sessão. Continuavam no aparelho:
- o rascunho do pré-prontuário (com CPF e histórico clínico);
- a última triagem;
- os PDFs gerados (`documentDirectory/pre-prontuario-*.pdf` e `cache/Print/`).

Como o `usePreProntuario` dá prioridade ao rascunho sobre o perfil, o próximo
usuário do aparelho recebia o formulário preenchido com os dados do anterior.
(Hoje essa precedência está em `useDocumento` + `mesclarRascunho`.)

**O que foi feito:** a criptografia não foi alterada, por decisão do projeto.
Só foi adicionada limpeza.
- `src/data/local/armazenamentoLocal.ts`: `limparDadosLocais()` apaga as chaves
  de `CHAVES_DO_USUARIO` (rascunho, marca de recuperação e as `CHAVES_LEGADAS`).
  A sessão do supabase-js não é tocada.
- A última triagem não é mais gravada no aparelho (o documento lê o histórico
  do servidor), mas `ultimaTriagemIA` continua em `CHAVES_LEGADAS`: quem
  atualizou o app ainda pode tê-la.
- `src/data/pdf/prontuarioPdf.ts`: `limparPdfsGerados()` apaga os PDFs com o
  prefixo `pre-prontuario-` e a pasta `cache/Print`.
- `src/domain/services/LimpezaLocalService.ts`: interface do domínio.
  O `core/di/container.ts` junta as duas funções acima nela.
- A limpeza roda em dois lugares:
  - `src/domain/usecases/auth/SignOut.ts`, só quando o logout dá certo (com erro
    de rede o usuário continua logado e precisa do rascunho);
  - `src/domain/usecases/auth/LimparDadosLocais.ts`, chamado pelo
    `AuthProvider` no evento `SIGNED_OUT`. Cobre sessão expirada, revogada ou
    encerrada em outro aparelho.
- As duas limpezas nunca lançam erro: falha ao apagar não trava o logout.

**Não regredir:**
- Toda chave nova gravada no AsyncStorage com dado do usuário entra em
  `CHAVES_DO_USUARIO`.
- Chave que o app deixa de gravar vai para `CHAVES_LEGADAS`, não some da limpeza.
- Todo arquivo novo gravado em disco precisa de limpeza equivalente.

## 7 — Troca de senha sem reautenticação (Média)

**Como estava:** a rota `nova-senha` ficava no mesmo grupo protegido das abas.
Qualquer sessão, inclusive um celular desbloqueado ou uma sessão roubada, podia
trocar a senha sem informar a atual. Além disso, a sessão aberta pelo link de
recuperação valia como login completo mesmo sem trocar a senha.

**Análise:** a tela só existe para a recuperação (não há "alterar senha" no
perfil), então restringi-la não remove nenhuma funcionalidade.

**O que foi feito:**
- `RecuperacaoSenhaRepository` (em `domain/repositories/AuthRepository.ts`),
  implementado por `recuperacaoSenhaLocal` em `armazenamentoLocal.ts`. É uma
  marca persistida: fechar o app no meio da recuperação não libera o acesso.
- `AtualizarSenha` recusa a troca se a marca não estiver ativa, e a apaga
  quando a troca dá certo.
- `AuthProvider`:
  - expõe `recuperandoSenha` e `encerrarRecuperacao()`;
  - marca a recuperação ao consumir o link;
  - relê a marca ao abrir o app;
  - zera o estado no `SIGNED_OUT`.
- `app/_layout.tsx`:
  - abas e pré-prontuário usam `guard={logado && !recuperandoSenha}`;
  - `nova-senha` usa `guard={logado && recuperandoSenha}`.
- `app/nova-senha.tsx`: ao salvar, chama `encerrarRecuperacao()` (o guard leva
  para as abas). Ganhou o botão "Cancelar e sair" para quem desistir.

**Não regredir:** se um dia houver "alterar senha" no perfil, ele deve pedir a
senha atual ou usar `supabase.auth.reauthenticate()`. Não reaproveitar a
`nova-senha`.

## 10 — Backup do Android e captura de tela (Média)

**Como estava:** `allowBackup` usava o padrão do Android (`true`), então os
dados locais e os PDFs podiam ir para backup (Google Drive/adb). Também não
havia bloqueio de print, gravação de tela nem da miniatura no alternador de apps.

**O que foi feito:**
- `app.json`: `"android": { "allowBackup": false }`.
- Dependência `expo-screen-capture ~57.0.3`, que funciona no Expo Go e não
  precisa de config plugin.
- `src/presentation/hooks/useTelaProtegida.ts`:
  - `useTelaProtegida(chave)`: `FLAG_SECURE` no Android; no iOS a gravação sai em branco;
  - `useProtecaoAlternadorApps()`: miniatura desfocada no iOS, chamado no `RootStack`.
- `useTelaProtegida` foi aplicado em `perfil`, `(tabs)/index` (triagem),
  `documento` (que substituiu `pre-prontuario`) e `nova-senha`.

**Não regredir:** toda tela nova que mostre dados de saúde, CPF ou senha chama
`useTelaProtegida('<nome-da-tela>')`, com uma chave única por tela.

**Atenção:** `allowBackup` só vale num build novo (`eas build`).

## 14 — Mensagens cruas do backend na tela (Baixa)

**Como estava:** o texto original era exibido ao usuário em quatro casos:
- `toAuthError`, quando não havia tradução;
- `toDomainError`, sempre;
- o erro do Firestore;
- o `error_description` da URL.

Esses textos podiam revelar tabelas, colunas, policies e projeto, e o da URL é
escrito por quem monta o link. O erro do login com Google também mostrava a
configuração de Redirect URLs ao usuário final.

**O que foi feito:**
- `src/data/supabase/errors.ts`:
  - sem tradução, o usuário vê uma mensagem genérica e o texto original vai só
    para o log em `__DEV__`;
  - o `code` do `DomainError` é mantido para a lógica do app;
  - foram adicionadas traduções para senha fraca, cadastro desativado e e-mail inválido.
- `src/data/firestore/client.ts`: mensagem genérica. O detalhe do Google só em `__DEV__`.
- `SupabaseAuthRepository.ts`:
  - erro vindo do link vira "Link inválido ou expirado. Solicite um novo.";
  - o detalhe de Redirect URLs só aparece em `__DEV__`.
- **Mantido de propósito:** o campo `erro` da Edge Function `triagem` continua
  sendo exibido, porque as mensagens foram escritas para o usuário e não expõem
  detalhes internos.

**Não regredir:**
- Não repassar `error.message` de SDK ou API para a UI.
- Traduza a mensagem em `MENSAGENS_AUTH` ou use a genérica.

## Testes

A suíte foi atualizada e ampliada: `SignOut`, `AtualizarSenha`,
`LimparDadosLocais`, `SupabaseAuthRepository` (PKCE e recusa de tokens
soltos), `AuthProvider` (estado de recuperação e limpeza no `SIGNED_OUT`),
`armazenamentoLocal`, `prontuarioPdf` e `errors`/`firestore/client`. Resultado:
64 suítes, 339 testes passando.
