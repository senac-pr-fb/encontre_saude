import { ROUTES } from "../../config/routes/routes.js";
import { authService } from "../../Services/authService.js";
import { supabase } from "../../config/supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {

    // --- Elementos da tela ---
    const faceEmail = document.getElementById("faceEmail");
    const faceNovaSenha = document.getElementById("faceNovaSenha");
    const btnBackLogin = document.getElementById("btnBackLogin");

    // Volta para o login sem salvar nada
    if (btnBackLogin) {
        btnBackLogin.addEventListener("click", () => {
            window.location.href = ROUTES.login;
        });
    }

    // -------------------------------------------------------------------------
    // ETAPA 1: Formulário de e-mail
    // O usuário informa o e-mail e o Supabase manda um link de recuperação.
    // Depois disso a gente só informa que o e-mail foi enviado — não tem mais.
    // O link do e-mail vai trazer o usuário de volta para esta mesma página,
    // mas desta vez com um token na URL que o Supabase vai detectar sozinho.
    // -------------------------------------------------------------------------
    const emailForm = document.getElementById("emailForm");
    const emailInput = document.getElementById("recoveryEmail");
    const emailSubmitBtn = emailForm.querySelector("button[type=submit]");

    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        emailSubmitBtn.disabled = true;
        emailSubmitBtn.textContent = "Enviando...";

        const { error } = await authService.resetPassword(email);

        if (error) {
            alert(`Não foi possível enviar o e-mail: ${error.message}`);
            emailSubmitBtn.disabled = false;
            emailSubmitBtn.textContent = "Enviar e-mail para Redefinir";
            return;
        }

        // Substitui o formulário por uma mensagem simples — o trabalho real
        // agora está no link que o usuário vai receber no e-mail.
        faceEmail.innerHTML = `
            <div class="brand">
                <i class="fas fa-envelope-open-text" style="font-size:48px; color:#0b57d0; margin-bottom:16px;"></i>
                <h2>E-mail enviado!</h2>
                <p>Verifique sua caixa de entrada em <strong>${email}</strong> e clique no link para criar uma nova senha.</p>
            </div>
        `;
    });

    // -------------------------------------------------------------------------
    // ETAPA 2: Detectar o retorno pelo link do e-mail
    // O Supabase emite o evento PASSWORD_RECOVERY quando o usuário abre a página
    // vindo de um link de recuperação. Só aí exibimos o formulário de nova senha.
    // Sem esse evento, o formulário fica escondido — evita acesso direto à URL.
    // -------------------------------------------------------------------------
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            // O token já está na sessão, mostramos agora o campo de nova senha
            faceEmail.classList.add("hidden");
            faceNovaSenha.classList.remove("hidden");
        }
    });

    // -------------------------------------------------------------------------
    // ETAPA 3: Formulário de nova senha
    // Chama updateUser só depois que a sessão de recuperação foi confirmada acima.
    // -------------------------------------------------------------------------
    const novaSenhaForm = document.getElementById("novaSenhaForm");
    const novaSenhaSubmitBtn = novaSenhaForm.querySelector("button[type=submit]");

    novaSenhaForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const pwd1 = document.getElementById("newPassword").value;
        const pwd2 = document.getElementById("confirmNewPassword").value;

        if (pwd1 !== pwd2) {
            alert("As senhas não coincidem. Tente novamente.");
            return;
        }

        novaSenhaSubmitBtn.disabled = true;
        novaSenhaSubmitBtn.textContent = "Salvando...";

        const { error } = await authService.updatePassword(pwd1);

        if (error) {
            alert(`Não foi possível atualizar a senha: ${error.message}`);
            novaSenhaSubmitBtn.disabled = false;
            novaSenhaSubmitBtn.textContent = "Modificar Senha e Acessar";
            return;
        }

        // Senha trocada com sucesso — redireciona para o perfil já autenticado
        alert("Senha atualizada com sucesso! Bem-vindo de volta.");
        window.location.href = ROUTES.perfil;
    });

});
