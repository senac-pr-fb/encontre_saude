import { ROUTES } from "./../../../config/routes/routes.js";

export function createMain() {
  const main = document.querySelector("main");
  if (!main) return;

  // 🔹 Título principal
  const textCenter1 = document.createElement("div");
  textCenter1.className = "textCenter";

  const h1 = document.createElement("h1");
  h1.textContent = "Sua saúde em primeiro lugar";
  textCenter1.appendChild(h1);

  // 🔹 Cards principais
  const cardsContainer = document.createElement("div");
  cardsContainer.className = "cards";

  const cardsData = [
    {
      title: "Farmácias",
      icon: "fa-solid fa-prescription-bottle-medical iconSaude",
      text: "Veja Onde se Cuidar: Farmácias e Informações de Saúde",
      route: ROUTES.farmacia
    },
    {
      title: "Primeiros Socorros",
      icon: "fa-solid fa-briefcase-medical iconSaude",
      text: "O que fazer enquanto o resgate não chega",
      route: ROUTES.primeirosSocorros
    },
    {
      title: "Ações Preventivas",
      icon: "fa-solid fa-shield-heart iconSaude",
      text: "Dicas e informações para manter-se sempre bem",
      route: ROUTES.prevensao
    }
  ];

  cardsData.forEach(({ title, icon, text, route }) => {
    const card = document.createElement("div");
    card.className = "card";

    // Título
    const h2 = document.createElement("h2");
    h2.textContent = title;

    // Ícone
    const cardIcon = document.createElement("i");
    cardIcon.className = icon;

    // Texto
    const p = document.createElement("p");
    p.textContent = text;

    // Botão
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = "Ver Mais";
    button.addEventListener("click", () => {
      window.location.href = route;
    });

    card.appendChild(h2);
    card.appendChild(cardIcon);
    card.appendChild(p);
    card.appendChild(button);
    cardsContainer.appendChild(card);
  });

  // 🔹 Monta no <main>
  main.appendChild(textCenter1);
  main.appendChild(cardsContainer);
  // textCenter2 removed in favor of shared footer
}
