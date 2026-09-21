import { ROUTES } from "../../config/routes/routes.js";
import { authService } from "../../Services/authService.js";
import { setupToggleSenha } from "../../shared/toggle_senha.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Redireciona se já estiver logado
    const { session } = await authService.getUserSession();
    if (session) {
        window.location.href = ROUTES.home;
        return;
    }

    setupToggleSenha();

    // 1. Lógica do botão de voltar
    const btnBackHome = document.getElementById("btnBackHome");
    if (btnBackHome) {
        btnBackHome.addEventListener("click", () => {
            window.location.href = ROUTES.home;
        });
    }

    const btnForgotPassword = document.querySelector(".btn-forgot-password");
    if (btnForgotPassword) {
        btnForgotPassword.addEventListener("click", () => {
            window.location.href = ROUTES.recuperarSenha;
        });
    }

    // 2. Referências aos formulários
    const btnGoToRegister = document.getElementById("btnGoToRegister");
    const btnGoToLogin = document.getElementById("btnGoToLogin");
    const loginFace = document.querySelector(".login-face");
    const registerFace = document.querySelector(".register-face");

    // Função para alternar o formulário que o usuário está vendo
    const toggleForm = () => {
        loginFace.classList.toggle("hidden");
        registerFace.classList.toggle("hidden");
    };

    btnGoToRegister.addEventListener("click", toggleForm);
    btnGoToLogin.addEventListener("click", toggleForm);

    // Login com Google Auth
    const btnGoogleLogin = document.getElementById("btnGoogleLogin");
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", async () => {
            btnGoogleLogin.disabled = true;
            btnGoogleLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

            const { error } = await authService.signInWithGoogle();

            if (error) {
                alert("Erro ao entrar com Google: " + error.message);
                btnGoogleLogin.disabled = false;
                btnGoogleLogin.innerHTML = '<i class="fab fa-google"></i> Continuar com o Google';
            }
        });
    }

    // 3. Respostas de submissão do formulário do Supabase
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Desabilita o botão para mostrar carregamento
        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        btnSubmit.textContent = "Carregando...";
        btnSubmit.disabled = true;

        const { data, error } = await authService.signIn(email, password);

        btnSubmit.textContent = "Avançar";
        btnSubmit.disabled = false;

        if (error) {
            alert("Erro ao fazer login: " + error.message);
            return;
        }

        alert("Bem-vindo de volta!");
        window.location.href = ROUTES.home;
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("regName").value;
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPassword").value;

        const btnSubmit = registerForm.querySelector('button[type="submit"]');
        btnSubmit.textContent = "Criando conta...";
        btnSubmit.disabled = true;

        const { data, error } = await authService.signUp(email, password);

        btnSubmit.textContent = "Cadastrar";
        btnSubmit.disabled = false;

        if (error) {
            alert("Erro ao criar conta: " + error.message);
            return;
        }

        // Se quiser salvar o nome na nova tabela de perfis_saude, pode chamar profileService aqui depois.

        alert("Conta criada com sucesso! Por favor, faça o login.");
        loginForm.reset();
        registerForm.reset();
        toggleForm(); // Volta para a tela de login
    });
});
