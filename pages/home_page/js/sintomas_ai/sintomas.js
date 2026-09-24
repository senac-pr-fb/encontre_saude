
import { createApi } from "./api.js";
import { createFeedbacks } from "./create_feedback.js";

export async function createSintomasSection() {
    const header = document.getElementById("header");
    const main = document.querySelector("main");

    if (!header || !main) return;

    const sintomasContainer = document.createElement("section");
    sintomasContainer.id = "sintomas";
    sintomasContainer.style.position = "relative";

    sintomasContainer.innerHTML = `
        <div class="sintomas-title-row">
            <h2>Triagem de Sintomas com IA</h2>
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
    `;

    header.insertAdjacentElement("afterend", sintomasContainer);

    createApi();
    createFeedbacks();
}
