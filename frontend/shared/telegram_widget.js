export function createTelegramWidget() {
    // Evita criar duplo caso a tela recarregue componentes
    if (document.getElementById("telegram-fab")) return;

    // Injeta os estilos do widget direto no head para evitar problemas de caminho relativo de CSS
    const styleBox = document.createElement("style");
    styleBox.textContent = `
        .telegram-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            background-color: #0088cc;
            color: #ffffff;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 34px;
            box-shadow: 0 4px 12px rgba(0, 136, 204, 0.4);
            cursor: pointer;
            z-index: 9999;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-decoration: none;
        }

        .telegram-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 136, 204, 0.6);
            color: #ffffff;
        }

        .telegram-fab::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background-color: #0088cc;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: -1;
            animation: telegram-pulse 2s infinite;
        }

        @keyframes telegram-pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
    `;
    document.head.appendChild(styleBox);

    // Cria o âncora do Telegram
    const a = document.createElement("a");
    a.id = "8529907810";
    // Mudar aqui para o link real do Bot depois
    a.href = "https://t.me/EncontreSaudeBot"; 
    a.target = "_blank";
    a.className = "telegram-fab";
    a.title = "Fale com nossa Automação";
    
    // Icone Telegram com micro-ajuste para ficar óticamente no centro do círculo
    a.innerHTML = `<i class="fa-brands fa-telegram" style="margin-right: 2px;"></i>`;
    
    document.body.appendChild(a);
}
