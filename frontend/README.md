# Encontre Saúde - Integração com Supabase

Este projeto é uma aplicação de saúde ("Encontre Saúde") construída puramente em **HTML, CSS e Vanilla JS** utilizando módulos modernos do Javascript (ES Modules - ESM).
Recentemente, a arquitetura do projeto foi expandida para suportar Autenticação e Banco de Dados (BaaS) através do servidor **Supabase**, adotando uma importação unificada via CDN JSDelivr para não ferir o design sem empacotadores (Node.js/NPM) do projeto original.

Abaixo documentamos as novas adições e os serviços de backend que estão agora presentes neste repositório.

## Arquitetura de Serviços

O back-end no Frontend do projeto foi modularizado em 3 frentes para organização:

### 1. `config/env.js` e Segurança (`.gitignore`)
As chaves do projeto (API Keys, URL do Banco, Chave Pública, etc) foram centralizadas num único arquivo com objetivo de referenciamento rápido. 
Esse arquivo `env.js` foi explicitamente isolado através do arquivo `.gitignore` logo na base do projeto. 
> ⚠ **Isso garante que ao enviar o projeto para o Github, pessoas mal intencionadas não roubarão sua conexão livre e keys secretas do Supabase.**

### 2. `config/supabaseClient.js` (O Singleton)
Através deste arquivo importamos ativamente toda a robusta lógica do banco de dados (da CDN oficial do site JSDelivr `https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm`) pra dentro do front-end.
Ele serve para gerar uma conexão única (Chamada de ***Singleton*** na programação) e disponibilizar a variável de client `supabase` onde precisarmos, poupando a memória e a rede dos dispositivos móveis do usuário final.

### 3. As Interfaces Lógicas (`/Services`)

Essas APIs servem para processar e blindar (com funções Try/Catch do JS) o que as suas telas e inputs HTML entregam, enviando para o banco os dados de forma correta e mastigadas:

- **`Services/authService.js`**: Única responsável pela Autenticação do sistema. Métodos disponíveis:
  - `signUp(email, password)` — cadastro de novo usuário
  - `signIn(email, password)` — login com e-mail/senha
  - `signOut()` — encerra a sessão
  - `getUserSession()` — retorna a sessão ativa (use em toda tela que exige login antes de exibir conteúdo)
  - `signInWithGoogle()` — login via OAuth Google
  - `resetPassword(email)` — dispara o e-mail de recuperação de senha
  - `updatePassword(newPassword)` — salva a nova senha (só funciona após o link do e-mail ser aberto)
- **`Services/profileService.js`**: Atinge a tabela `perfis_saude` no Supabase. Guarda a ficha médica do usuário. Usa **Upsert**: atualiza se o registro existe, cria se não existe.

## Recuperação de Senha

O fluxo usa dois métodos do Supabase Auth e ocorre em duas visitas separadas à mesma página:

**Visita 1 — Usuário solicita o reset:**
1. Usuário digita o e-mail em `/pages/recuperar_senha_pages/recuperar_senha.html`
2. O front-end chama `authService.resetPassword(email)`
3. Supabase envia um e-mail com um link apontando de volta para essa mesma página
4. A tela exibe apenas "verifique seu e-mail" — o trabalho passa a ser do link

**Visita 2 — Usuário volta pelo link do e-mail:**
1. O Supabase processa o token da URL e cria uma sessão temporária
2. `supabase.auth.onAuthStateChange` detecta o evento `PASSWORD_RECOVERY`
3. Só então o formulário de nova senha é exibido (sem o evento, o form permanece oculto)
4. Usuário digita e confirma a nova senha; o front-end chama `authService.updatePassword(senha)`
5. Redireciona para o perfil já autenticado

> ⚠ **Configuração necessária no Dashboard do Supabase:**  
> Em *Authentication → URL Configuration → Redirect URLs*, adicione:  
> - `http://localhost:PORTA/pages/recuperar_senha_pages/recuperar_senha.html` (desenvolvimento)  
> - URL equivalente em produção  
> Sem isso, o Supabase bloqueia o redirecionamento do link do e-mail.

## Como rodar o sistema localmente
Se clonou este repositório, atente-se aos próximos passos:
1. Crie o arquivo `/config/env.js` (ele não sobe pro Git por segurança) com as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
2. No Dashboard do Supabase, crie a tabela `perfis_saude` em Postgres com os campos de saúde usados pela UI.
3. Configure o **Redirect URL** de recuperação de senha conforme descrito na seção acima.
