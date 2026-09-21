export function carregarBairros() {
  const bairros = [
    "Alvorada",
    "Cango",
    "Centro",
    "Cristo Rei",
    "Jardim Floresta",
    "Luther King",
    "Marrecas",
    "Nossa Senhora Aparecida",
    "Pinheirinho",
    "São Cristóvão",
    "São Miguel",
    "Vila Nova"
  ];

  /*Bairros sem Farmacia*/
    /*"Aeroporto",
    "Água Branca",
    "Antônio de Paiva Cantelmo",
    "Guanabara",
    "Industrial",
    "Jardim Itália",
    "Jardim Virgínia",
    "Júpiter",
    "Miniguaçu",
    "Nova Petrópolis",
    "Novo Mundo",
    "Padre Ulrico",
    "Pinheirão",
    "Presidente Kennedy",
    "Sadia",
    "São Francisco",
    "Seminário",
    */

  const select = document.getElementById("bairro");
  if (!select) return;

  // limpa opções existentes
  select.innerHTML = "";

  // adiciona a opção inicial
  const opcaoTodos = document.createElement("option");
  opcaoTodos.value = "";
  opcaoTodos.textContent = "Todos os Bairros";
  select.appendChild(opcaoTodos);

  // adiciona os bairros em ordem alfabética
  bairros.sort().forEach(bairro => {
    const option = document.createElement("option");
    option.value = bairro;
    option.textContent = bairro;
    select.appendChild(option);
  });
}

// Chame a função quando a página carregar
document.addEventListener("DOMContentLoaded", carregarBairros);
