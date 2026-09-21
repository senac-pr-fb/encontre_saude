export function createFeedbacks() {
  const container = document.getElementById("feedbacks");
  if (!container) return;
  container.innerHTML = "";
  container.classList.add("feedbacks");

  const feedbacksData = [
    {
      title: "Não Urgente",
      text: "Caso para atendimento na unidade de saúde mais próxima da residência.",
      color: "#5EA7FF",
    },
    {
      title: "Pouco Urgente",
      text: "Caso para atendimento preferencial nas unidades de atenção básica.",
      color: "#ABFB4F",
    },
    {
      title: "Urgente",
      text: "Caso de gravidade moderada, necessidade de atendimento médico, sem risco imediato.",
      color: "#FFEA00",
    },
    {
      title: "Muito Urgente",
      text: "Caso grave e risco significativo de evoluir para morte. Atendimento urgente.",
      color: "#FF771C",
    },
    {
      title: "Emergência",
      text: "Caso gravíssimo, com necessidade de atendimento imediato e risco de morte.",
      color: "#D51717",
    },
  ];

  // Aqui pega o objeto completo, não só text
  feedbacksData.forEach(({ title, text, color }) => {
    const div = document.createElement("div");
    div.classList.add("feedback");

    const bola = document.createElement("div");
    bola.classList.add("bola");
    bola.style.backgroundColor = color; // Aplica a cor da bolinha

    div.appendChild(bola);
    container.appendChild(div);

    // Passa o objeto completo para o modal abrir
    div.addEventListener("click", () => {
      openModal({ title, text, color });
    });
  });
}

function openModal(data) {
  let modal = document.getElementById("feedbackModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "feedbackModal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <div class="modal-header">
          <div class="modal-bola"></div>
          <h2 class="modal-title"></h2>
        </div>
        <p class="modal-text"></p>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".close").addEventListener("click", () => {
      modal.style.display = "none";
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  const bola = modal.querySelector(".modal-bola");
  const title = modal.querySelector(".modal-title");
  const text = modal.querySelector(".modal-text");

  bola.style.backgroundColor = data.color;
  title.textContent = data.title;
  text.textContent = data.text;

  modal.style.display = "flex";
}

// inicializa feedbacks quando a página carregar

