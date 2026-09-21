import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEY } from "../../../../config/env.js";
import { chatService } from "../../../../Services/chatService.js";
import { authService } from "../../../../Services/authService.js";

// CHAVE DO HISTÓRICO NO localStorage
const HISTORICO_KEY = "chatHistorico";

export async function salvarSessaoNoHistorico(mensagens) {
    const { session } = await authService.getUserSession();
    if (!session) return; // Só salva se logado
    if (!mensagens || mensagens.length === 0) return;

    const historico = JSON.parse(localStorage.getItem(HISTORICO_KEY) || "[]");

    const novaSessao = {
        id: Date.now(),
        data: new Date().toLocaleString("pt-BR"),
        mensagens
    };

    // Mantém no máximo 20 sessões
    historico.unshift(novaSessao);
    if (historico.length > 20) historico.pop();

    localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
}

export function carregarHistorico() {
    return JSON.parse(localStorage.getItem(HISTORICO_KEY) || "[]");
}

export function createApi() {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Mapeamento de Cores e Níveis
    const niveis = {
        1: { cor: '#5EA7FF', texto: 'Não Urgente' },
        2: { cor: '#ABFB4F', texto: 'Pouco Urgente' },
        3: { cor: '#FFEA00', texto: 'Urgente' },
        4: { cor: '#FF771C', texto: 'Muito Urgente' },
        5: { cor: '#D51717', texto: 'Emergência' }
    };

    const promptMestre = `
Você é um assistente de IA especializado em triagem de sintomas de saúde. Sua tarefa é analisar o relato do usuário e fornecer uma orientação estruturada.

**Instruções de Resposta:**
Você DEVE retornar sua resposta APENAS no formato JSON, sem crase ou markdown (ex: \`\`\`json). O JSON deve conter os seguintes campos:

{
  "nivel": (número de 1 a 5),
  "resumo": "...",
  "recomendacao": "...",
  "primeiros_socorros": "...",
  "unidade_recomendada": "...",
  "sintomas": {
    "febre": boolean,
    "dor_de_cabeca": boolean,
    "tosse": boolean,
    "falta_de_ar": boolean,
    "dor_no_peito": boolean,
    "nausea_vomito": boolean,
    "diarreia": boolean,
    "dor_abdominal": boolean,
    "dor_nas_costas": boolean,
    "tontura": boolean,
    "fraqueza": boolean,
    "coriza": boolean
  }
}

**Escala de Classificação:**
1 - Não Urgente (Autocuidado)
2 - Pouco Urgente (Observação/Farmácia)
3 - Urgente (UBS/Posto de Saúde)
4 - Muito Urgente (UPA)
5 - Emergência (Hospital/SAMU 192)

**Texto do Usuário:**
[AQUI_VOCE_INSERE_O_TEXTO_DO_USUARIO]
`;

    // Armazena mensagens da sessão atual (texto puro para histórico)
    let sessaoAtual = [];

    async function avaliarSintomasDireto(textoUsuario) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const promptFinal = promptMestre.replace("[AQUI_VOCE_INSERE_O_TEXTO_DO_USUARIO]", textoUsuario);

            const result = await model.generateContent(promptFinal);
            const response = await result.response;
            const text = response.text().trim();
            const cleanText = text.replace(/```json|```/g, '').trim();

            return JSON.parse(cleanText);

        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);
            return null;
        }
    }

    // --- Chat Logic ---

    function appendMessage(content, type) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;

        if (typeof content === 'string') {
            msgDiv.innerHTML = `<p>${content}</p>`;
        } else {
            msgDiv.appendChild(content); // Append DOM element if processed content
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    }

    function showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return null;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<i class="fa-solid fa-ellipsis fa-bounce"></i> Analisando sintomas...';

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function formatResponse(resultado) {
        const container = document.createElement('div');

        if (!resultado || !resultado.nivel) {
            container.innerHTML = `<p style="color:red">Não consegui analisar seus sintomas. Tente descrever com mais detalhes.</p>`;
            return container;
        }

        const nivel = resultado.nivel;
        const cor = niveis[nivel] ? niveis[nivel].cor : '#ccc';
        const textoNivel = niveis[nivel] ? niveis[nivel].texto : 'Avaliado';

        container.innerHTML = `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom:0.5rem; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem;">
                <div style="width:12px; height:12px; border-radius:50%; background:${cor}; box-shadow: 0 0 5px ${cor};"></div>
                <strong style="font-size:1.1rem;">${textoNivel} (Nível ${nivel})</strong>
            </div>
            <p>${resultado.resumo}</p>
            
            <div style="background:rgba(255,255,255,0.1); padding:0.8rem; border-radius:8px; margin-top:0.8rem;">
                <strong>🩺 Recomendação:</strong>
                <p style="margin-top:0.2rem; font-size:0.95rem;">${resultado.recomendacao}</p>
            </div>

            ${resultado.primeiros_socorros ? `
            <div style="margin-top:0.8rem;">
                <strong>🩹 Dica:</strong>
                <p style="margin-top:0.2rem; font-size:0.95rem;">${resultado.primeiros_socorros}</p>
            </div>` : ''}

            ${resultado.unidade_recomendada ? `
            <div style="margin-top:1rem; font-weight:bold; color:#fff; background:${cor}; color:#000; padding:0.5rem 1rem; border-radius:50px; display:inline-block; font-size:0.9rem;">
                🏥 Ir para: ${resultado.unidade_recomendada}
            </div>` : ''}
        `;
        return container;
    }

    async function handleSendMessage() {
        const input = document.getElementById('user-input');
        const btn = document.getElementById('send-btn');

        const texto = input.value.trim();
        if (!texto) return;

        // 1. UI Updates
        input.value = '';
        input.disabled = true;
        btn.disabled = true;

        // 2. Add User Message
        appendMessage(texto, 'user');

        // Guarda na sessão atual (só texto)
        sessaoAtual.push({ tipo: 'user', texto });

        // 3. Show Typing
        showTypingIndicator();

        // 4. API Call
        const resultado = await avaliarSintomasDireto(texto);

        // 5. Hide Typing & Restore UI
        removeTypingIndicator();
        input.disabled = false;
        btn.disabled = false;
        input.focus();

        // 6. Add AI Message
        if (resultado) {
            const formattedContent = formatResponse(resultado);
            appendMessage(formattedContent, 'ai');

            // Guarda resposta da IA na sessão atual (texto resumido)
            const resumoAI = `[Nível ${resultado.nivel}] ${resultado.resumo}`;
            sessaoAtual.push({ tipo: 'ai', texto: resumoAI });

            // 7. SALVA NO SUPABASE (Persistência real com sintomas)
            await chatService.saveInteraction(texto, resumoAI, resultado.sintomas);
        }

        // 8. Salva sessão no histórico local (Cache)
        salvarSessaoNoHistorico(sessaoAtual);

        // 8. Salva a última triagem para uso no Pré-Prontuário
        if (resultado) {
            const dadosTriagem = {
                textoUsuario: texto,
                resultadoIA: resultado,
                timestamp: Date.now()
            };
            localStorage.setItem('ultimaTriagemIA', JSON.stringify(dadosTriagem));
        }
    }

    function setupInteraction() {
        const btn = document.getElementById('send-btn');
        const input = document.getElementById('user-input');

        if (btn) {
            btn.addEventListener('click', handleSendMessage);
        }

        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleSendMessage();
            });
        }
    }

    // Inicializa
    setupInteraction();
}