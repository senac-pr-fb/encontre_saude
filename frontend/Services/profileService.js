import { supabase } from '../config/supabaseClient.js';
import { authService } from './authService.js';

export const profileService = {
    // Buscar o perfil completo de saúde do usuário atual
    async getProfile() {
        try {
            console.group("🔍 [profileService] Buscando Perfil...");
            const { session, error: sessionError } = await authService.getUserSession();
            
            if (!session) {
                console.warn("⚠️ Usuário não está logado.");
                console.groupEnd();
                return { profile: null, error: "Não logado" };
            }

            const userId = session.user.id;
            console.log("Buscando dados para o UserID:", userId);

            const { data, error } = await supabase
                .from('dados_saude')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            console.log("Sucesso! Dados recebidos:", data || "Nenhum perfil encontrado.");
            console.groupEnd();
            return { profile: data, error: null };
        } catch (error) {
            console.error("❌ Erro no getProfile:", error.message);
            console.groupEnd();
            return { profile: null, error };
        }
    },

    // Salva (cria ou atualiza) os dados através da função upsert
    async saveProfile(profileData) {
        try {
            console.group("💾 [profileService] Salvando Perfil...");
            const { session, error: sessionError } = await authService.getUserSession();
            if (!session) throw new Error("Acesso negado: Usuário não está logado");

            const userId = session.user.id;

            const updates = {
                user_id: userId,
                idade: typeof profileData.idade === 'number' ? profileData.idade : null,
                peso: typeof profileData.peso === 'number' ? profileData.peso : null,
                altura: typeof profileData.altura === 'number' ? profileData.altura : null,
                sexo: profileData.sexo || null,
                CPF: profileData.CPF || null,
                data_nascimento: profileData.data_nascimento || null,
                telefone: profileData.telefone || null,
                fuma: profileData.fuma !== undefined ? Boolean(profileData.fuma) : false,
                bebe: profileData.bebe !== undefined ? Boolean(profileData.bebe) : false,
                alergia_medicamento: profileData.alergia_medicamento || null,
                alergias: profileData.alergias || null,
                medicamentos_em_uso: profileData.medicamentos_em_uso || null,
                doencas_preexistentes: profileData.doencas_preexistentes || null,
                historico_familiar: profileData.historico_familiar || null,
                possui_deficiencia: profileData.possui_deficiencia || null,
                contato_medico_particular: profileData.contato_medico_particular || '',
                pressao_arterial: profileData.pressao_arterial || null,
                frequencia_cardiaca: profileData.frequencia_cardiaca || null,
                temperatura: profileData.temperatura || null,
                saturacao_oxigenio: profileData.saturacao_oxigenio || null,
                observacoes: profileData.observacoes || null,
            };

            console.log("🚀 [profileService] Enviando dados para o Supabase:", updates);

            const { data, error } = await supabase
                .from('dados_saude')
                .upsert(updates, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) {
                console.error("❌ [profileService] Erro no Supabase:", error);
                throw error;
            }
            
            console.log("✅ [profileService] Perfil salvo com sucesso no banco!", data);
            console.groupEnd();
            return { profile: data, error: null };
        } catch (error) {
            console.error("❌ [profileService] Erro no saveProfile:", error.message);
            console.groupEnd();
            return { profile: null, error };
        }
    }
};
