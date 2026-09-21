import { supabase } from '../config/supabaseClient.js';

export const authService = {
    // Cadastro de novo usuário
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Erro no signUp:", error.message);
            return { data: null, error };
        }
    },

    // Login com usuário existente
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Erro no signIn:", error.message);
            return { data: null, error };
        }
    },

    // Desconectar o usuário atual
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error("Erro no signOut:", error.message);
            return { error };
        }
    },

    // Obter sessão atual do usuário (Verificar quem está logado ao carregar a página)
    async getUserSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { session: data.session, user: data.session?.user || null, error: null };
        } catch (error) {
            console.error("Erro obtendo sessão:", error.message);
            return { session: null, user: null, error };
        }
    },

    // Observar mudanças no estado de autenticação
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    },
    // Login com Google (OAuth)
    async signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/index.html'
                }
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Erro no login Google:", error.message);
            return { data: null, error };
        }
    },

    // Passo 1 da recuperação: envia e-mail com o link de redefinição.
    // O Supabase dispara um link que redireciona o usuário de volta para a URL
    // definida em redirectTo já com um token de sessão temporário na URL.
    async resetPassword(email) {
        try {
            const redirectTo = window.location.origin + '/pages/recuperar_senha_pages/recuperar_senha.html';
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Erro no resetPassword:", error.message);
            return { data: null, error };
        }
    },

    // Passo 2 da recuperação: atualiza de fato a senha do usuário.
    // Só funciona depois que o Supabase estabeleceu uma sessão via o link do e-mail
    // (o evento PASSWORD_RECOVERY em onAuthStateChange confirma isso).
    async updatePassword(newPassword) {
        try {
            const { data, error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Erro no updatePassword:", error.message);
            return { data: null, error };
        }
    }
};
