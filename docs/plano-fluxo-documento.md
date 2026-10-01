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

### Fase 3 — Tela `/documento` (botão do meio) ✅
- [x] Estado `pronto`: `PreviaDocumento` + **Gerar PDF** (`gerarDoContexto`
      valida com `prontuarioSchema`; se a ficha tiver dado fora da regra, abre a
      edição com aviso).
- [x] Estado `dados-faltando`: lista o que falta + **Completar dados**.
      **Provisório:** abre a edição (etapa 1 = exatamente os obrigatórios);
      na fase 4 passa a levar à pré-triagem.
- [x] Estado `sem-triagem` / `triagem-vencida`: **Fazer pré-triagem** ou
      **Preencher manualmente**.
- [x] **Editar antes de gerar**: `ProntuarioForm` dentro da tela;
      `mesclarRascunho` põe o rascunho por cima do contexto.
- [x] Sintomas do documento = `triagem.sintomas` da IA.
- [x] `useTelaProtegida('documento')`.
- [x] Gerador único extraído: `useConcluirPreProntuario`. Tela "Pronto" e
      aviso extraídos (`DocumentoPronto`, `AvisoProntuario`).
- [x] Adiantado da fase 6: rota `/pre-prontuario` e `usePreProntuario`
      removidos (ficaram sem uso). Home: "Gerar pré-prontuário" → `/documento`,
      aviso de 24 h no lugar do de 20 min.

### Fase 4.0 — Pedir só os obrigatórios que faltam ✅
Problema: se faltava só o CPF, "Completar dados" abria o formulário de 4
etapas e a pessoa precisava passar por todas para gerar.
- [x] Caso de uso `CompletarObrigatorios` (domínio): valida só os campos
      enviados com `etapaDados.pick`, relê a ficha e grava apenas eles; nome
      vai para a conta (`atualizarNome`).
- [x] `CamposDadosPessoais` (extraído da etapa 1) + `CampoTexto` (extraído do
      `ProntuarioForm`): mesmos campos e máscaras nos dois lugares.
- [x] Componente `CamposObrigatorios`: renderiza **apenas** `contexto.faltantes`;
      sem sexo na ficha, nada vem pré-marcado. Ao salvar, o contexto se
      recalcula e a tela volta à prévia pronta para **Gerar PDF**.
- [x] `/documento`, estado `dados-faltando`: `CamposObrigatorios` no lugar de
      abrir o formulário inteiro.
- [x] Edição manual: primeiro só os obrigatórios faltantes; depois o
      formulário abre nos sintomas (`pularDadosPessoais`) quando os dados
      pessoais são válidos.
- [x] `mesclarRascunho`: campo em branco no rascunho não apaga o que a ficha tem.
- [x] O mesmo componente vira o "campo estruturado" da pré-triagem (fase 4).

### Fase 4 — Pré-triagem com perguntas (Home + Edge Function) ✅ (código)
- [x] Edge Function lê `dados_saude` (JWT do usuário, RLS) e inclui resumo
      clínico no prompt. **Só colunas clínicas**: nome, CPF e telefone nunca
      são lidos; a data de nascimento vira idade dentro da função.
- [x] Saída nova (opcional): `perguntas[]` (máx. 3, cortado no código; vazio na
      2ª rodada e no nível 5) e `atualizacoes_ficha{}` (alergias, medicamentos,
      doenças — só o que o paciente afirmou).
- [x] Entrada nova (opcional): `respostas[]` e `historico_id`. A 2ª rodada
      atualiza a mesma linha (relato + perguntas/respostas viram a queixa); se o
      UPDATE não passar, grava linha nova para não perder a orientação.
- [x] Migration `20260930120000_historico_ia_update_proprio.sql` (idempotente):
      policy de UPDATE do dono em `historico_ia` e `sintomas_atendimento`.
- [x] App: `AnaliseTriagem` (triagem + perguntas + sugestões + historicoId);
      repositório aceita a resposta antiga da função (campos novos opcionais).
- [x] Home: `PerguntasTriagem` (responder ou pular), `SugestaoFicha` (só grava
      com confirmação, via `AtualizarFichaClinica`), `CamposObrigatorios` para a
      identificação (direto ao Supabase, sem IA) e **Gerar pré-prontuário**.
- [x] Perfil → "Atualizar pela pré-triagem" abre a Home com `?completar=1`
      (obrigatórios faltantes no topo).
- [ ] **Pendente (ambiente):** `supabase db push` (migration) e
      `npm run deploy` em `services/` (função). Não foi possível rodar a função
      localmente aqui (sem Deno/Docker) — validar com `npm run serve` ou após o
      deploy.

### Fase 5 — Tela de perfil ✅
- [x] `ResumoFicha`: barra de completude (`contexto.completude`: 5 obrigatórios
      + 6 campos clínicos), o que falta para o documento e **Atualizar pela
      pré-triagem** (principal → `router.dismissTo('/')`, a Home).
      **Provisório:** até a fase 4 leva à triagem comum, sem perguntas.
- [x] Ficha de saúde (`PerfilForm` atual), abaixo do resumo.
- [x] **Pré-prontuário manual** (secundário) → `/documento?modo=editar`.
- [x] Sair.

### Fase 6 — Limpeza
- [ ] Remover `triagemLocal`, `TriagemRecente`, `VALIDADE_TRIAGEM_MS` e a chave
      `ultimaTriagemIA` (também de `CHAVES_DO_USUARIO`).
- [x] Remover rota `/pre-prontuario`, link "Gerar pré-prontuário com esta
      triagem" e aviso de 20 min (feito na fase 3).
- [ ] `RealizarTriagem` sem repositório local.
- [ ] Atualizar testes de `useTriagem`, `usePreProntuario`, `RealizarTriagem`,
      `armazenamentoLocal`.
- [ ] Atualizar `mobile/CLAUDE.md` se alguma regra de segurança mudar de lugar.

Ordem: 1 → 2 → 3 → 5 → 4.0 → 4 → 6, um commit por fase. Até a fase 4, o modo
"completar dados" pede os campos diretamente, sem IA.

## Regras que continuam valendo (`mobile/CLAUDE.md`)

- Tela nova com dado de saúde, CPF ou senha chama `useTelaProtegida('<chave>')`.
- Chave nova no AsyncStorage entra em `CHAVES_DO_USUARIO`.
- Não repassar `error.message` de SDK/API para a UI.
- `npx expo lint` e `npx tsc --noEmit` antes de fechar cada fase.

## Fora do escopo

- Qualquer mudança no site.
- Lista de atendimentos anteriores dentro do PDF (acréscimo possível na fase 3).
