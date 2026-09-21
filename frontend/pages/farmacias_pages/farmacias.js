import { createSidebar } from "./../../shared/sidebar.js";
import { createMap } from "./js/create_map.js";
import { carregarBairros } from "./js/create_bairros.js";

// Aguarda o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", async () => {

    createSidebar();
    await createMap();
    carregarBairros();
});