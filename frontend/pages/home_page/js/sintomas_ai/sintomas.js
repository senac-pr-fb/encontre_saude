
import { createApi, carregarHistorico } from "./api.js";
import { createFeedbacks } from "./create_feedback.js";

import { authService } from "../../../../Services/authService.js";

export async function createSintomasSection() {
    const { session } = await authService.getUserSession();
    const isLoggedIn = !!session;

    const header = document.getElementById("header");
    const main = document.querySelector("main");

    if (!header || !main) return;

    const sintomasContainer = document.createElement("section");
    sintomasContainer.id = "sintomas";
    sintomasContainer.style.position = "relative";

    sintomasContainer.innerHTML = `
        <div class="sintomas-title-row">
            <h2>Triagem de Sintomas com IA</h2>
            ${isLoggedIn ? `
            <button id="btn-historico-chat" class="btn-historico" title="Ver histórico de conversas">
                <i class="fas fa-clock-rotate-left"></i>
                <span>Histórico</span>
            </button>` : ''}
        </div>

        <div class="sintomas-container">
            <!-- Left Panel (Legend) -->
            <div class="sintomas-left">
                <div class="aviso-box">
                    <h3><i class="fa-solid fa-triangle-exclamation"></i> Aviso Importante</h3>
                    <p>
                        Esta ferramenta utiliza inteligência artificial para triagem preliminar e <strong>não substitui uma consulta médica</strong>.
                        Em casos de emergência, ligue para 192 ou procure o hospital mais próximo.
                    </p>
                </div>

                <div class="legend-container">
                    <span class="legend-title" style="font-weight:bold; display:block; margin-bottom:1rem;">Níveis de Urgência</span>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#5EA7FF"></div>
                            <div class="legend-text">
                                <strong>Não Urgente</strong>
                                <span>Sintomas leves, sem risco imediato.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#ABFB4F"></div>
                            <div class="legend-text">
                                <strong>Pouco Urgente</strong>
                                <span>Desconforto moderado, observe a evolução.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#FFEA00"></div>
                            <div class="legend-text">
                                <strong>Urgente</strong>
                                <span>Sintomas significativos, busque ajuda se persistir.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#FF771C"></div>
                            <div class="legend-text">
                                <strong>Muito Urgente</strong>
                                <span>Sintomas intensos, requer atenção rápida.</span>
                            </div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-dot" style="background:#D51717"></div>
                            <div class="legend-text">
                                <strong>Emergência</strong>
                                <span>Risco à vida, procure atendimento imediato (192).</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel (Chat Interface) -->
            <div class="sintomas-right">
                <div id="chat-container">
                    <div id="chat-messages">
                        <!-- Initial AI Message -->
                        <div class="message ai">
                            <p>Olá! Sou seu assistente de saúde virtual. Por favor, descreva o que você está sentindo com o máximo de detalhes (onde dói, há quanto tempo, intensidade).</p>
                        </div>
                    </div>
                    
                    <div id="input-area">
                        <input type="text" id="user-input" placeholder="Digite seus sintomas aqui..." autocomplete="off">
                        <button id="send-btn">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div id="feedbacks"></div>

        <!-- Painel de Histórico (só renderizado se logado) -->
        ${isLoggedIn ? `
        <div id="painel-historico" class="painel-historico painel-historico--fechado">
            <div class="painel-historico__header">
                <h3><i class="fas fa-clock-rotate-left"></i> Histórico de Conversas</h3>
                <button id="btn-fechar-historico" class="btn-fechar-historico" title="Fechar histórico">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="historico-lista" class="historico-lista">
                <!-- Preenchido via JS -->
            </div>
        </div>` : ''}
    `;

    header.insertAdjacentElement("afterend", sintomasContainer);

    createApi();
    createFeedbacks();

    // =============================================
    // Lógica do painel de histórico (só se logado)
    // =============================================
    if (isLoggedIn) {
        const btnHistorico = document.getElementById("btn-historico-chat");
        const painelHistorico = document.getElementById("painel-historico");
        const btnFechar = document.getElementById("btn-fechar-historico");
        const historicoLista = document.getElementById("historico-lista");

        async function renderizarHistorico() {
            const historico = await carregarHistorico();
            historicoLista.innerHTML = "";

            if (historico.length === 0) {
                historicoLista.innerHTML = `
                    <div class="historico-vazio">
                        <i class="fas fa-comment-medical"></i>
                        <p>Nenhuma conversa salva ainda.</p>
                        <small>Suas consultas com a IA aparecerão aqui.</small>
                    </div>
                `;
                return;
            }

            historico.forEach((sessao) => {
                const item = document.createElement("div");
                item.className = "historico-item";

                const userMsg = sessao.mensagens.find(m => m.tipo === "user");
                const aiMsg = sessao.mensagens.find(m => m.tipo === "ai");

                item.innerHTML = `
                    <div class="historico-item__data">
                        <i class="fas fa-calendar-alt"></i> ${sessao.data}
                    </div>
                    ${userMsg ? `
                    <div class="historico-item__user">
                        <span class="historico-badge historico-badge--user">Você</span>
                        <p>${userMsg.texto}</p>
                    </div>` : ''}
                    ${aiMsg ? `
                    <div class="historico-item__ai">
                        <span class="historico-badge historico-badge--ai">IA</span>
                        <p>${aiMsg.texto}</p>
                    </div>` : ''}
                `;

                historicoLista.appendChild(item);
            });
        }

        btnHistorico.addEventListener("click", () => {
            renderizarHistorico();
            painelHistorico.classList.toggle("painel-historico--fechado");
        });

        btnFechar.addEventListener("click", () => {
            painelHistorico.classList.add("painel-historico--fechado");
        });
    }
}
