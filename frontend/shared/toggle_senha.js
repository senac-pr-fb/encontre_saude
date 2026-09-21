/**
 * Ativa o toggle de visibilidade da senha em todos os botões
 * com a classe .btn-toggle-senha na página.
 * 
 * Cada botão deve ter o atributo data-target com o id do input.
 */
export function setupToggleSenha() {
    document.querySelectorAll(".btn-toggle-senha").forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon  = btn.querySelector("i");

            if (!input) return;

            const visivel = input.type === "text";
            input.type = visivel ? "password" : "text";
            icon.classList.toggle("fa-eye",        visivel);
            icon.classList.toggle("fa-eye-slash", !visivel);
            btn.title = visivel ? "Mostrar senha" : "Ocultar senha";
        });
    });
}
