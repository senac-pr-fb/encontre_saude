import { createSidebar } from "./../../shared/sidebar.js";
import { createFooter } from "../../shared/footer.js";
import { APP_DOWNLOAD } from "../../config/routes/routes.js";

function fillDownloadLinks() {
    document.querySelectorAll("[data-app-download]").forEach(a => a.href = APP_DOWNLOAD.url);
    document.querySelectorAll("[data-app-qrcode]").forEach(img => img.src = APP_DOWNLOAD.qrCode);
}

function init() {
    createSidebar();
    fillDownloadLinks();
    createFooter();
}

init();
