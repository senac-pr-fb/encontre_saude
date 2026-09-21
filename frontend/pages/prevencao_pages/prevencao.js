import { createSidebar } from "./../../shared/sidebar.js";
import { infoPrevencao } from "./js/info_prevencao.js";
import { createFooter } from "../../shared/footer.js";

function init() {
    createSidebar();
    infoPrevencao();
    createFooter();
}

init();