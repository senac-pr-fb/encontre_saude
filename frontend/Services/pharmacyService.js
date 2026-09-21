import { supabase } from '../config/supabaseClient.js';

export const pharmacyService = {
    async getPharmacies() {
        try {
            const { data, error } = await supabase
                .from('pharmacies')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Erro ao buscar farmácias:", error.message);
            return { data: [], error };
        }
    }
};
