# Encontre Saúde

Este projeto é uma aplicação de saúde ("Encontre Saúde") construída puramente em **HTML, CSS e Vanilla JS** utilizando módulos modernos do Javascript (ES Modules - ESM), com **Vite** para build/dev.

## Arquitetura de Serviços

### 1. `config/env.js` e Segurança (`.gitignore`)
As chaves do projeto (API Keys, credenciais do Firebase, etc.) ficam no arquivo `.env` na raiz do projeto e são lidas via `import.meta.env` (padrão Vite) em `config/env.js`.
O arquivo `.env` está listado no `.gitignore` e **nunca deve ser commitado**.
> ⚠ **Isso garante que ao enviar o projeto para o GitHub, pessoas mal intencionadas não terão acesso às chaves do projeto.**

### 2. `config/firebaseClient.js` (O Singleton)
Inicializa o Firebase (Firestore) usando as credenciais de `config/env.js` e expõe a instância `db`, usada pelos serviços que precisam consultar dados.

### 3. As Interfaces Lógicas (`/Services`)

- **`Services/pharmacyService.js`**: Busca a lista de farmácias na coleção `pharmacies` do Firestore. Cada documento deve conter os campos: `nome`, `endereco`, `telefone`, `site`, `instagram`, `horario`, `bairro`, `tipo`, `lat`, `lng`.

### 4. Triagem de Sintomas com IA
A tela inicial (`pages/home_page/js/sintomas_ai`) usa a API do **Gemini** (`@google/generative-ai`) diretamente do navegador para triagem preliminar de sintomas. A chamada é feita client-side, então a chave (`VITE_API_KEY`) fica visível para quem inspecionar o tráfego de rede — isso é uma limitação inerente a aplicações sem backend. A conversa não é salva em nenhum lugar (nem localmente, nem em banco de dados).

## Como rodar o sistema localmente
1. Crie o arquivo `.env` na raiz do projeto (ele não sobe pro Git por segurança) com as variáveis:
   - `VITE_API_KEY` (chave da API Gemini)
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
2. No Firebase, crie a coleção `pharmacies` no Firestore com os documentos das farmácias (campos listados acima).
3. Instale as dependências com `npm install` e rode com `npm run dev`.
