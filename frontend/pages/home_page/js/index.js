import { createMain } from "./main.js";
import { createSidebar } from "./../../../shared/sidebar.js";
import { createFooter } from "./../../../shared/footer.js";
import { createSintomasSection } from "./sintomas_ai/sintomas.js";

document.addEventListener("DOMContentLoaded", async () => {
    await createSidebar()
    try {
        await createSintomasSection()
    } catch (e) {
        console.error("Error creating sintomas section:", e);
    }
    createMain()
    createFooter()
});