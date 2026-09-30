# Plano — fluxo único do pré-prontuário (mobile)

Branch: `feat/monorepo-mobile`. O site (`frontend/`) não muda nesta branch; o
backend compartilhado (`services/`) só recebe mudanças aditivas, para o site
continuar funcionando como está.

## Objetivo

Hoje a jornada "estou sentindo algo → documento" está partida em dois fluxos:
a triagem da Home e o formulário de 4 etapas, ligados por um atalho de 20
minutos no AsyncStorage. O plano junta tudo num fluxo só, guiado por um
contexto de saúde global que se atualiza sozinho.

| Onde | Papel |
|---|---|
| **Home** | Pré-triagem com IA. Quando faltam dados, a IA faz perguntas adicionais. |
| **Botão do meio** (navbar, maior) | Gera o documento. Não faz triagem: se falta algo, redireciona. |
| **Perfil** (avatar no canto superior direito) | Prioriza a pré-triagem; ficha de saúde; pré-prontuário manual como opção. |

## Decisões tomadas

- Triagem vale **24 h** para gerar o documento pelo botão do meio.
- Dados de identificação (nome, CPF, nascimento, telefone, sexo) são pedidos na
  conversa da pré-triagem, mas com campos estruturados: **não passam pela IA**.
- A IA nunca grava direto na ficha: ela sugere atualizações, o usuário confirma
  e o app salva pelo `SavePerfil` (validação do `perfilSchema`).
- A Edge Function `triagem` muda nesta branch, só com campos opcionais novos.
- Um gerador só: todo caminho termina em `concluir` → PDF → tela "Pronto". A
  edição manual é um passo opcional dentro de `/documento`, não outra rota.

## Fluxo

```
 Botão do meio ─┐
 Resultado da   ├──▶  /documento  ── lê o contexto de saúde (ficha + histórico)
 pré-triagem   ─┤         │
 Perfil ────────┘         ├─ pronto ────────▶ prévia ──▶ [Gerar PDF]
                          │                     └──▶ [Editar antes de gerar] (opcional)
                          ├─ dados faltando ─▶ pré-triagem pergunta ──▶ volta pronto
                          └─ sem triagem ≤24h ▶ [Fazer pré-triagem]  ou
                                                [Preencher manualmente] (opcional)
```

Histórico:
- A queixa, o nível e os sintomas vêm da última triagem de `historico_ia`
  (servidor), não do AsyncStorage.
- Cada triagem confirmada e cada documento atualizam a ficha; a próxima
  triagem já parte dela.
- Documento gerado a partir de uma triagem complementa a **mesma** linha de
  `historico_ia`. Documento só manual cria linha nova, como hoje.

## Fases

### Fase 1 — Contexto de saúde global ✅
- [x] `domain/entities/ContextoSaude.ts`: tipos, `SituacaoDocumento`, validade de 24 h.
- [x] `domain/usecases/contexto/montarContexto.ts`: função pura
      `(perfil, historico, nomeConta, agora) → ContextoSaude`. `faltantes` usa
      as regras de `etapaDados` (mesma validação do formulário).
- [x] `domain/usecases/prontuario/contextoParaFormulario.ts`: ficha (+ triagem)
      → `ProntuarioFormInput`. Substitui o mapeamento interno do `usePreProntuario`.
- [x] `presentation/hooks/useHistorico.ts` extraído do `useTriagem` (uma query só).
- [x] `presentation/hooks/useContextoSaude.ts`.
- [x] Invalidar `['perfil']` e `['historico']` depois do `concluir`.
- [x] Testes de `montarContexto`, `contextoParaFormulario` e `useContextoSaude`.

### Fase 2 — Navegação ✅
- [x] Abas: Home · Socorros · **[Pré-prontuário]** · Prevenção · Farmácias.
      `BotaoDocumento` como `tabBarButton` da rota `(tabs)/gerar-documento`
      (só reserva o lugar; aberta por link, redireciona).
      **Provisório:** aponta para `/pre-prontuario`; na fase 3 troca para
      `/documento` (em `(tabs)/_layout.tsx` e `(tabs)/gerar-documento.tsx`).
- [x] Perfil: `(tabs)/perfil.tsx` → `app/perfil.tsx` (Stack, mesmo
      `Stack.Protected`, header nativo "Meu perfil").
- [x] Avatar: `CabecalhoAba` (título + `BotaoPerfil`) nas 4 abas — o `Screen`
      não serve porque Farmácias usa `FlatList`. Ponto vermelho no avatar
      quando `contexto.faltantes` não está vazio.

### Fase 3 — Tela `/documento` (botão do meio)
- [ ] Estado `pronto`: prévia + **Gerar PDF** (reusa `concluir` e `prontuarioPdfService`).
- [ ] Estado `dados-faltando`: lista o que falta + **Completar na pré-triagem**.
- [ ] Estado `sem-triagem` / `triagem-vencida`: **Fazer pré-triagem** ou
      **Preencher manualmente**.
- [ ] **Editar antes de gerar**: `ProntuarioForm` dentro da tela, pré-preenchido
      pelo contexto; rascunho local só neste modo.
- [ ] Sintomas do documento = `triagem.sintomas` da IA.
- [ ] `useTelaProtegida('documento')`.

### Fase 4 — Pré-triagem com perguntas (Home + Edge Function)
- [ ] Edge Function lê `dados_saude` (JWT do usuário, RLS) e inclui resumo
      clínico no prompt.
- [ ] Saída nova (opcional): `perguntas[]` e `atualizacoes{}` clínicas.
- [ ] Entrada nova (opcional): `respostas[]` e `historico_id` (2ª rodada
      atualiza a mesma linha).
- [ ] Verificar policy de UPDATE em `historico_ia`; criar migration se faltar.
- [ ] Home: perguntas como continuação da conversa; campos de identificação
      estruturados (direto ao Supabase); cartão "Atualizar sua ficha?" com
      confirmação; botão **Gerar documento** → `/documento`.
- [ ] Modo "completar dados" (chegando de `/documento` ou do perfil).

### Fase 5 — Tela de perfil
- [ ] Cartão de completude + **Atualizar pela pré-triagem** (principal).
- [ ] Ficha de saúde (`PerfilForm` atual).
- [ ] **Pré-prontuário manual** (secundário) → `/documento` em modo edição.
- [ ] Sair.

### Fase 6 — Limpeza
- [ ] Remover `triagemLocal`, `TriagemRecente`, `VALIDADE_TRIAGEM_MS` e a chave
      `ultimaTriagemIA` (também de `CHAVES_DO_USUARIO`).
- [ ] Remover rota `/pre-prontuario`, link "Gerar pré-prontuário com esta
      triagem" e aviso de 20 min.
- [ ] `RealizarTriagem` sem repositório local.
- [ ] Atualizar testes de `useTriagem`, `usePreProntuario`, `RealizarTriagem`,
      `armazenamentoLocal`.
- [ ] Atualizar `mobile/CLAUDE.md` se alguma regra de segurança mudar de lugar.

Ordem: 1 → 2 → 3 → 5 → 4 → 6, um commit por fase. Até a fase 4, o modo
"completar dados" pede os campos diretamente, sem IA.

## Regras que continuam valendo (`mobile/CLAUDE.md`)

- Tela nova com dado de saúde, CPF ou senha chama `useTelaProtegida('<chave>')`.
- Chave nova no AsyncStorage entra em `CHAVES_DO_USUARIO`.
- Não repassar `error.message` de SDK/API para a UI.
- `npx expo lint` e `npx tsc --noEmit` antes de fechar cada fase.

## Fora do escopo

- Qualquer mudança no site.
- Lista de atendimentos anteriores dentro do PDF (acréscimo possível na fase 3).
