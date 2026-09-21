import { ROUTES } from "../config/routes/routes.js";
import { createTelegramWidget } from "./telegram_widget.js";
import { authService } from "../Services/authService.js";

export async function createSidebar() {
    const { session } = await authService.getUserSession();

    const header = document.getElementById("header");
    if (!header) return;

    const sidebar = document.createElement("nav");
    sidebar.className = "sidebar";

    const logoContainer = document.createElement("div");
    logoContainer.className = "sidebar-logo";
    const logoImg = document.createElement("img");
    logoImg.src = "/assets/logoTipo.png";
    logoImg.alt = "Encontre Saúde Logo";
    logoContainer.appendChild(logoImg);
    sidebar.appendChild(logoContainer);

    const navList = document.createElement("div");
    navList.className = "sidebar-nav";

    const navItems = [
        { text: "Home", icon: "fa-house", href: ROUTES.home },
        { text: "Primeiros Socorros", icon: "fa-kit-medical", href: ROUTES.primeirosSocorros },
        { text: "Ações Preventivas", icon: "fa-shield-heart", href: ROUTES.prevensao },
        { text: "Farmácias", icon: "fa-prescription-bottle-medical", href: ROUTES.farmacia },
    ];

    // Se estiver logado, mostra Perfil. Se não, mostra Login.
    if (session) {
        navItems.push({ text: "Meu Perfil", icon: "fa-user", href: ROUTES.perfil });
    } else {
        navItems.push({ text: "Login / Cadastro", icon: "fa-arrow-right-to-bracket", href: ROUTES.login });
    }

    navItems.forEach(({ text, icon, href }) => {
        const a = document.createElement("a");
        a.href = href;
        a.className = "nav-item";
        a.innerHTML = `
            <i class="fas ${icon} nav-icon"></i>
            <span class="nav-text">${text}</span>
        `;
        navList.appendChild(a);
    });
    sidebar.appendChild(navList);

    // Ouvir mudanças de auth para atualizar o menu em tempo real
    authService.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            window.location.href = ROUTES.home;
        }
    });

    const footerContacts = document.createElement("div");
    footerContacts.className = "sidebar-footer";

    const contactItems = [
        { icon: "fa-brands fa-whatsapp", href: "https://wa.me/46991213122" },
        { icon: "fa-solid fa-phone", href: "tel:+5546991213122" },
        { icon: "fa-solid fa-envelope", href: "mailto:seuemail@gabrielwag971@gmail.com" },
    ];

    contactItems.forEach(({ icon, href }) => {
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.className = "contact-icon";
        a.innerHTML = `<i class="${icon}"></i>`;
        footerContacts.appendChild(a);
    });
    sidebar.appendChild(footerContacts);

    // Mobile Toggle Button
    const mobileToggle = document.createElement("button");
    mobileToggle.className = "mobile-menu-toggle";
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(mobileToggle);

    // Overlay for closing on click outside
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    function toggleSidebar() {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
        mobileToggle.innerHTML = sidebar.classList.contains("active")
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    }

    mobileToggle.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", toggleSidebar);

    // Close on navigation
    sidebar.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

    // Append to body to avoid positioning issues with transformed parents (like animated headers)
    document.body.prepend(sidebar);

    // Add class to body to adjust layout
    document.body.classList.add("with-sidebar");

    // Injeta Botão Flutuante Global do Telegram
    createTelegramWidget();
}
