
import { createSidebar } from "./../../shared/sidebar.js";
import { createDicas } from "./js/dicas.js";
import { initPrimeirosSocorros } from "./js/init_primeiros_socorros.js";
import { createFooter } from "../../shared/footer.js";

// Aguarda o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", () => {
    createSidebar()

    initPrimeirosSocorros()
    createDicas()
    createFooter()
});