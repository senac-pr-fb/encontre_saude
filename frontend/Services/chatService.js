import { supabase } from '../config/supabaseClient.js';
import { authService } from './authService.js';

export const chatService = {
    // Salva uma nova interação e seus sintomas detectados
    async saveInteraction(userDescription, aiResponse, symptoms = null) {
        try {
            console.group("🤖 [chatService] Salvando Interação e Sintomas...");
            const { session } = await authService.getUserSession();
            if (!session) {
                console.groupEnd();
                return { data: null, error: "Não logado" };
            }

            // 1. Salva na tabela historico_ia
            const { data: chatData, error: chatError } = await supabase
                .from('historico_ia')
                .insert([{
                    user_id: session.user.id,
                    descricao_usuario: userDescription,
                    resposta_ia: aiResponse
                }])
                .select()
                .single();

            if (chatError) throw chatError;

            // 2. Se houver sintomas detectados, salva na tabela sintomas_atendimento
            if (symptoms && chatData.id) {
                const symptomsPayload = {
                    historico_id: chatData.id,
                    febre: !!symptoms.febre,
                    dor_de_cabeca: !!symptoms.dor_de_cabeca,
                    tosse: !!symptoms.tosse,
                    falta_de_ar: !!symptoms.falta_de_ar,
                    dor_no_peito: !!symptoms.dor_no_peito,
                    nausea_vomito: !!symptoms.nausea_vomito,
                    diarreia: !!symptoms.diarreia,
                    dor_abdominal: !!symptoms.dor_abdominal,
                    dor_nas_costas: !!symptoms.dor_nas_costas,
                    tontura: !!symptoms.tontura,
                    fraqueza: !!symptoms.fraqueza,
                    coriza: !!symptoms.coriza
                };

                const { error: sympError } = await supabase
                    .from('sintomas_atendimento')
                    .insert([symptomsPayload]);

                if (sympError) console.error("⚠️ Erro ao salvar sintomas:", sympError.message);
            }

            console.log("✅ Tudo salvo com sucesso!");
            console.groupEnd();
            return { data: chatData, error: null };
        } catch (error) {
            console.error("❌ Erro no processo de salvamento:", error.message);
            console.groupEnd();
            return { data: null, error };
        }
    },

    // Busca o histórico completo do usuário logado (incluindo sintomas)
    async getUserHistory() {
        try {
            console.group("📜 [chatService] Buscando Histórico IA completo...");
            const { session } = await authService.getUserSession();
            if (!session) {
                console.groupEnd();
                return { history: [], error: "Usuário não logado" };
            }

            // Busca histórico e sintomas em uma única consulta usando JOIN do Supabase
            const { data, error } = await supabase
                .from('historico_ia')
                .select(`
                    *,
                    sintomas_atendimento (*)
                `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log("Sucesso! Total de registros com sintomas:", data.length);
            console.groupEnd();
            return { history: data, error: null };
        } catch (error) {
            console.error("❌ Erro ao buscar histórico IA:", error.message);
            console.groupEnd();
            return { history: [], error };
        }
    },

    // Busca a ÚLTIMA consulta completa (Chat + Sintomas) para o Pré-Prontuário
    async getLatestFullConsultation() {
        try {
            console.group("📑 [chatService] Buscando Última Consulta...");
            const { session } = await authService.getUserSession();
            if (!session) {
                console.groupEnd();
                return { data: null, error: "Não logado" };
            }

            // 1. Busca a última conversa
            const { data: chat, error: chatError } = await supabase
                .from('historico_ia')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (chatError) {
                if (chatError.code === 'PGRST116') {
                    console.log("Nenhuma conversa encontrada.");
                    console.groupEnd();
                    return { data: null, error: null };
                }
                throw chatError;
            }

            // 2. Busca os sintomas vinculados a essa conversa
            const { data: symptoms, error: sympError } = await supabase
                .from('sintomas_atendimento')
                .select('*')
                .eq('historico_id', chat.id)
                .single();

            console.log("Consulta encontrada:", { chat, symptoms });
            console.groupEnd();
            return { data: { chat, symptoms }, error: null };
        } catch (error) {
            console.error("❌ Erro ao buscar consulta completa:", error.message);
            console.groupEnd();
            return { data: null, error };
        }
    }, // ← fechamento do getLatestFullConsultation

    // Salva uma consulta feita manualmente (via formulário de pré-prontuário)
    async saveManualConsultation(queixa, sintomas, dadosClinicos = null) {

        try {
            console.group("📝 [chatService] Salvando Consulta Manual...");
            const { session } = await authService.getUserSession();
            if (!session) {
                console.groupEnd();
                return { error: "Não logado" };
            }

            // 1. Cria o registro no histórico (usando um texto padrão para a resposta da IA)
            const { data: chatData, error: chatError } = await supabase
                .from('historico_ia')
                .insert([{
                    user_id: session.user.id,
                    descricao_usuario: queixa,
                    resposta_ia: "Pré-Prontuário gerado manualmente pelo usuário.",
                    dados_clinicos: dadosClinicos
                }])
                .select()
                .single();

            if (chatError) throw chatError;

            // 2. Salva os sintomas vinculados (Mapeamento de nomes amigáveis para colunas do banco)
            const symptomsPayload = {
                historico_id: chatData.id,
                febre: !!(sintomas["Febre"] || sintomas["febre"]),
                dor_de_cabeca: !!(sintomas["Dor de Cabeça"] || sintomas["dor_de_cabeca"]),
                tosse: !!(sintomas["Tosse"] || sintomas["tosse"]),
                falta_de_ar: !!(sintomas["Falta de Ar"] || sintomas["falta_de_ar"]),
                dor_no_peito: !!(sintomas["Dor no Peito"] || sintomas["dor_no_peito"]),
                nausea_vomito: !!(sintomas["Náusea/Vômito"] || sintomas["nausea_vomito"]),
                diarreia: !!(sintomas["Diarreia"] || sintomas["diarreia"]),
                dor_abdominal: !!(sintomas["Dor Abdominal"] || sintomas["dor_abdominal"]),
                dor_nas_costas: !!(sintomas["Dor nas Costas"] || sintomas["dor_nas_costas"]),
                tontura: !!(sintomas["Tontura"] || sintomas["tontura"]),
                fraqueza: !!(sintomas["Fraqueza/Cansaço"] || sintomas["fraqueza"]),
                coriza: !!(sintomas["Coriza"] || sintomas["coriza"])
            };

            console.log("📊 [chatService] Payload de sintomas:", symptomsPayload);

            const { error: sympError } = await supabase
                .from('sintomas_atendimento')
                .insert([symptomsPayload]);

            if (sympError) throw sympError;

            console.log("✅ Consulta manual salva com sucesso!");
            console.groupEnd();
            return { data: chatData, error: null };
        } catch (error) {
            console.error("❌ Erro ao salvar consulta manual:", error.message);
            console.groupEnd();
            return { error };
        }
    }
};
