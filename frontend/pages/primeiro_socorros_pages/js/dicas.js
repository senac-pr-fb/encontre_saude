export function createDicas() {
    const dicas = [
        "Manter a calma durante emergências ajuda você e a vítima.",
        "Sempre verifique se o local é seguro antes de prestar socorro.",
        "Use luvas descartáveis para evitar contaminação ao ajudar alguém.",
        "Se a pessoa estiver inconsciente, chame ajuda imediatamente e verifique a respiração.",
        "Em caso de queimadura, lave a área com água fria por pelo menos 10 minutos.",
        "Nunca retire objetos perfurantes do corpo da vítima — isso pode piorar a lesão.",
        "Evite mover uma pessoa com suspeita de fratura na coluna.",
        "Tenha sempre um kit de primeiros socorros em casa e no carro.",
        "Aprender RCP pode salvar vidas — considere fazer um curso básico.",
        "Em caso de envenenamento, não provoque vômito sem orientação médica."
    ];

    function criarDica(dica) {
        const container = document.getElementById("extra-tip");
        container.innerHTML = `
    <h3 style="text-align: center;">💡 Você sabia?</h3>
    <p>${dica}</p>
  `;
    }

    // Mostra uma dica aleatória ao carregar
    function mostrarDicaAleatoria() {
        const indice = Math.floor(Math.random() * dicas.length);
        criarDica(dicas[indice]);
    }

    // Inicia com uma dica e troca a cada 10 segundos
    mostrarDicaAleatoria();
    setInterval(mostrarDicaAleatoria, 10000);

}